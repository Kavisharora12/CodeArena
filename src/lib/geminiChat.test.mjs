import assert from "node:assert/strict";
import { test } from "node:test";

import { chatOutputValidation } from "../schemas/chatOutputSchema.ts";
import {
  buildGeminiChatPrompt,
  describeGeminiError,
  generateGeminiChatResponse,
  getGeminiErrorStatus,
  getGeminiApiKey,
  GEMINI_CHAT_MODEL,
} from "./geminiChat.ts";

test("accepts a short natural-language greeting without source code", () => {
  assert.deepEqual(chatOutputValidation.safeParse({ inputMessage: "Hello" }).data, {
    inputMessage: "Hello",
  });
});

test("accepts programming questions and optional short editor context", () => {
  const result = chatOutputValidation.safeParse({
    inputMessage: "How does a JavaScript closure work?",
    sourceCode: "",
  });
  assert.equal(result.success, true);
});

test("rejects empty or whitespace-only messages with a useful validation error", () => {
  for (const inputMessage of ["", "   "]) {
    const result = chatOutputValidation.safeParse({ inputMessage });
    assert.equal(result.success, false);
    assert.equal(result.error.issues[0].message, "Enter a message before sending.");
  }
});

test("includes optional code as context without requiring it", () => {
  const prompt = buildGeminiChatPrompt("Hello");
  assert.match(prompt, /User message:\nHello/u);
  assert.doesNotMatch(prompt, /JavaScript code for context/u);
  assert.match(buildGeminiChatPrompt("Review this", "console.log(1)"), /console\.log\(1\)/u);
});

test("uses the configured Gemini model and returns actual generated text", async () => {
  let receivedPrompt = "";
  const response = await generateGeminiChatResponse("Hello", undefined, async (prompt) => {
    receivedPrompt = prompt;
    return "Hi there!";
  });
  assert.equal(response, "Hi there!");
  assert.match(receivedPrompt, /Hello/u);
  assert.equal(GEMINI_CHAT_MODEL, "gemini-3.8-flash");
});

test("reports missing or blank Gemini configuration without exposing a value", () => {
  assert.equal(getGeminiApiKey(undefined), null);
  assert.equal(getGeminiApiKey("   "), null);
  assert.equal(getGeminiApiKey("configured-server-secret"), "configured-server-secret");
});

test("reports Gemini upstream status and redacts the server key from development details", () => {
  const error = Object.assign(new Error("API key secret-value is not valid"), { status: 401 });
  const diagnostic = describeGeminiError(error, "secret-value", true);
  assert.equal(getGeminiErrorStatus(error), 401);
  assert.match(diagnostic.message, /GEMINI_API_KEY/u);
  assert.match(diagnostic.message, /HTTP 401/u);
  assert.equal(diagnostic.detail.includes("secret-value"), false);
  assert.match(diagnostic.detail, /\[redacted\]/u);
  assert.match(
    describeGeminiError(Object.assign(new Error("quota"), { status: 429 }), "key", false).message,
    /quota/iu,
  );
});

test("does not fabricate a response when Gemini fails or returns no text", async () => {
  await assert.rejects(
    generateGeminiChatResponse("Hello", undefined, async () => {
      throw new Error("upstream failure");
    }),
    /upstream failure/u,
  );
  await assert.rejects(
    generateGeminiChatResponse("Hello", undefined, async () => undefined),
    /empty response/u,
  );
});
