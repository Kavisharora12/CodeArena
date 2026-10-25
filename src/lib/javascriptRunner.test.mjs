import assert from "node:assert/strict";
import { test } from "node:test";

import { runJavaScript } from "./javascriptRunner.ts";
import { gradeExecutionResults, outputMatches } from "./codeGrading.ts";
import { acquireExecutionSlot, consumeExecutionRateLimit } from "./executionGuard.ts";

test("runs JavaScript with stdin and captures stdout and stderr", async () => {
  const result = await runJavaScript({
    sourceCode: 'process.stdin.setEncoding("utf8"); process.stdin.on("data", value => console.log(value.trim()));',
    input: "hello\n",
  });

  assert.equal(result.status, "Finished");
  assert.equal(result.stdout.trim(), "hello");
  assert.equal(result.stderr, "");
});

test("passes multiline Windows-style stdin to line-oriented programs unchanged", async () => {
  const result = await runJavaScript({
    sourceCode: `
      let input = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", chunk => input += chunk);
      process.stdin.on("end", () => {
        const [left, right] = input.trim().split(/\\s+/).map(Number);
        console.log(left + right);
      });
    `,
    input: "2\r\n3\r\n",
  });

  assert.equal(result.status, "Finished");
  assert.equal(result.stdout, "5\n");
  assert.equal(result.stderr, "");
  assert.equal(result.exitCode, 0);
});

test("reports syntax errors", async () => {
  const result = await runJavaScript({ sourceCode: "function (", input: "" });
  assert.equal(result.status, "Syntax Error");
  assert.match(result.stderr, /SyntaxError/u);
});

test("reports runtime errors", async () => {
  const result = await runJavaScript({
    sourceCode: 'throw new Error("boom");',
    input: "",
  });
  assert.equal(result.status, "Runtime Error");
  assert.match(result.stderr, /boom/u);
});

test("terminates an infinite loop", async () => {
  const result = await runJavaScript({
    sourceCode: "while (true) {}",
    input: "",
    timeoutMs: 200,
  });
  assert.equal(result.status, "Time Limit Exceeded");
});

test("terminates excessive output", async () => {
  const result = await runJavaScript({
    sourceCode: 'process.stdout.write("x".repeat(70000));',
    input: "",
  });
  assert.equal(result.status, "Output Limit Exceeded");
  assert.ok(Buffer.byteLength(result.stdout) <= 64 * 1024);
});

test("does not expose the parent environment to submitted code", async () => {
  process.env.CODEARENA_TEST_SECRET = "parent-secret";
  try {
    const result = await runJavaScript({
      sourceCode: 'console.log(process.env.CODEARENA_TEST_SECRET || "not exposed");',
      input: "",
    });
    assert.equal(result.status, "Finished");
    assert.equal(result.stdout.trim(), "not exposed");
  } finally {
    delete process.env.CODEARENA_TEST_SECRET;
  }
});

test("denies access to files outside the temporary source file", async () => {
  const result = await runJavaScript({
    sourceCode: 'require("node:fs").readFileSync(process.execPath, "utf8");',
    input: "",
  });
  assert.equal(result.status, "Runtime Error");
  assert.match(result.stderr, /permission|denied/iu);
});

test("denies child process creation", async () => {
  const result = await runJavaScript({
    sourceCode: 'require("node:child_process").spawnSync(process.execPath, ["-e", ""]);',
    input: "",
  });
  assert.equal(result.status, "Runtime Error");
  assert.match(result.stderr, /permission|denied/iu);
});

test("rejects oversized stdin before starting a child process", async () => {
  await assert.rejects(
    runJavaScript({ sourceCode: "console.log(1)", input: "x".repeat(16 * 1024 + 1) }),
    /16 KB limit/u,
  );
});

test("normalizes line endings and surrounding whitespace for grading", () => {
  assert.equal(outputMatches("  5\r\n", "5\n"), true);
  assert.equal(outputMatches("5 6", "5\n6"), false);
});

test("grades every case and reports passed/total accurately", () => {
  const finished = (stdout) => ({
    status: "Finished",
    stdout,
    stderr: "",
    runtimeMs: 1,
    exitCode: 0,
    error: null,
  });
  assert.deepEqual(
    gradeExecutionResults([
      { run: finished("5\n"), expected: "5" },
      { run: finished("wrong"), expected: "6" },
    ]),
    { passedTestCases: 1, totalTestCases: 2, allPassed: false, status: "Wrong Answer" },
  );
});

test("does not count runtime failures as passed test cases", () => {
  const result = gradeExecutionResults([
    {
      run: {
        status: "Runtime Error",
        stdout: "",
        stderr: "TypeError: invalid input",
        runtimeMs: 4,
        exitCode: 1,
        error: "TypeError: invalid input",
      },
      expected: "anything",
    },
  ]);

  assert.deepEqual(result, {
    passedTestCases: 0,
    totalTestCases: 1,
    allPassed: false,
    status: "Runtime Error",
  });
});

test("enforces per-process execution concurrency and user rate limits", () => {
  const releaseOne = acquireExecutionSlot();
  const releaseTwo = acquireExecutionSlot();
  assert.ok(releaseOne);
  assert.ok(releaseTwo);
  assert.equal(acquireExecutionSlot(), null);
  releaseOne();
  releaseTwo();

  const uid = `runner-test-${Date.now()}`;
  for (let index = 0; index < 2; index += 1) {
    assert.equal(consumeExecutionRateLimit(uid, 2), true);
  }
  assert.equal(consumeExecutionRateLimit(uid, 2), false);
});
