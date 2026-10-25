import { execFile, spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { promisify } from "node:util";

export const MAX_SOURCE_BYTES = 64 * 1024;
export const MAX_INPUT_BYTES = 16 * 1024;
export const MAX_OUTPUT_BYTES = 64 * 1024;
export const MAX_EXECUTION_MS = 2_000;

export type JavaScriptRunStatus =
  | "Finished"
  | "Syntax Error"
  | "Runtime Error"
  | "Time Limit Exceeded"
  | "Output Limit Exceeded";

export interface JavaScriptRunResult {
  status: JavaScriptRunStatus;
  stdout: string;
  stderr: string;
  runtimeMs: number;
  exitCode: number | null;
  error: string | null;
}

const execFileAsync = promisify(execFile);

interface JavaScriptRunOptions {
  sourceCode: string;
  input: string;
  timeoutMs?: number;
}

async function assertUnprivilegedAccount() {
  if (typeof process.getuid === "function" && process.getuid() === 0) {
    throw new Error("Do not run the local code runner as root.");
  }
  if (process.platform === "win32") {
    const systemRoot = process.env.SystemRoot;
    if (!systemRoot) throw new Error("Cannot verify Windows account elevation.");
    const whoamiPath = path.join(systemRoot, "System32", "whoami.exe");
    const { stdout } = await execFileAsync(whoamiPath, ["/groups"], {
      encoding: "utf8",
      timeout: 2_000,
      maxBuffer: 16 * 1024,
      windowsHide: true,
    });
    if (/S-1-16-(12288|16384)\b/u.test(stdout)) {
      throw new Error("Do not run the local code runner from an elevated Windows session.");
    }
  }
}

function nodeSupportsPermissionModel() {
  const [major = 0, minor = 0] = process.versions.node.split(".").map(Number);
  return major >= 22 || (major === 20 && minor >= 13);
}

function limitedEnvironment(): NodeJS.ProcessEnv {
  const allowed = ["PATH", "Path", "SystemRoot", "WINDIR", "TEMP", "TMP"];
  const environment: NodeJS.ProcessEnv = { NODE_ENV: "production" };
  for (const key of allowed) {
    const value = process.env[key];
    if (value !== undefined) environment[key] = value;
  }
  return environment;
}

export async function runJavaScript({
  sourceCode,
  input,
  timeoutMs = MAX_EXECUTION_MS,
}: JavaScriptRunOptions): Promise<JavaScriptRunResult> {
  await assertUnprivilegedAccount();
  if (!nodeSupportsPermissionModel()) {
    throw new Error("The local runner requires Node.js 20.13+ or 22+.");
  }

  if (Buffer.byteLength(sourceCode, "utf8") > MAX_SOURCE_BYTES) {
    throw new Error("Source code exceeds the 64 KB limit.");
  }
  if (Buffer.byteLength(input, "utf8") > MAX_INPUT_BYTES) {
    throw new Error("Input exceeds the 16 KB limit.");
  }

  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "codearena-run-"));
  const scriptPath = path.join(tempDirectory, "submission.cjs");
  const startedAt = performance.now();
  let timedOut = false;
  let outputExceeded = false;

  try {
    await writeFile(scriptPath, sourceCode, { encoding: "utf8", mode: 0o600 });
    const child = spawn(
      process.execPath,
      [
        "--permission",
        "--max-old-space-size=64",
        "--max-semi-space-size=4",
        `--allow-fs-read=${scriptPath}`,
        scriptPath,
      ],
      {
        cwd: tempDirectory,
        env: limitedEnvironment(),
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      },
    );

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let outputBytes = 0;
    const collect = (target: Buffer[]) => (chunk: Buffer | string) => {
      const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      const remaining = MAX_OUTPUT_BYTES - outputBytes;
      if (remaining > 0) {
        const accepted = data.subarray(0, remaining);
        target.push(accepted);
        outputBytes += accepted.length;
      }
      if (data.length > remaining && !outputExceeded) {
        outputExceeded = true;
        child.kill("SIGKILL");
      }
    };

    child.stdout.on("data", collect(stdoutChunks));
    child.stderr.on("data", collect(stderrChunks));
    child.stdin.on("error", () => undefined);

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    const completion = new Promise<{
      exitCode: number | null;
      spawnError: Error | null;
    }>((resolve) => {
      let spawnError: Error | null = null;
      child.once("error", (error) => {
        spawnError = error;
      });
      child.once("close", (exitCode) => resolve({ exitCode, spawnError }));
    });

    child.stdin.end(input, "utf8");
    const { exitCode, spawnError } = await completion;
    clearTimeout(timer);
    const stdout = Buffer.concat(stdoutChunks).toString("utf8");
    const stderr = Buffer.concat(stderrChunks).toString("utf8");
    const runtimeMs = performance.now() - startedAt;

    if (spawnError) throw spawnError;
    const status: JavaScriptRunStatus = outputExceeded
      ? "Output Limit Exceeded"
      : timedOut
        ? "Time Limit Exceeded"
        : exitCode === 0
          ? "Finished"
          : /SyntaxError:/u.test(stderr)
            ? "Syntax Error"
            : "Runtime Error";

    return {
      status,
      stdout,
      stderr,
      runtimeMs,
      exitCode,
      error:
        status === "Finished"
          ? null
          : status === "Time Limit Exceeded"
            ? `Execution exceeded the ${timeoutMs} ms time limit.`
            : status === "Output Limit Exceeded"
              ? `Combined stdout and stderr exceeded the ${MAX_OUTPUT_BYTES} byte limit.`
              : stderr.trim() || status,
    };
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}
