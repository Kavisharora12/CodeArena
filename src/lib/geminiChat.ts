export const GEMINI_CHAT_MODEL = "gemini-3.8-flash";

export function getGeminiApiKey(value: string | undefined): string | null {
  const apiKey = value?.trim();
  return apiKey || null;
}

export function getGeminiErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  if ("status" in error && typeof error.status === "number") return error.status;
  if ("statusCode" in error && typeof error.statusCode === "number") return error.statusCode;
  return null;
}

export function describeGeminiError(
  error: unknown,
  apiKey: string,
  development: boolean,
): { message: string; status: number | null; detail?: string } {
  const status = getGeminiErrorStatus(error);
  const messages: Record<number, string> = {
    400: "Gemini rejected the request. Check the Gemini model and API key restrictions.",
    401: "Gemini rejected the server API key. Check GEMINI_API_KEY and restart the server.",
    403: "Gemini denied access. Check that the Generative Language API is enabled and the server key is allowed.",
    404: "The configured Gemini model was not found. Check the model name supported by your API.",
    429: "Gemini rate limit or quota reached. Check your Google AI quota and retry later.",
    500: "Gemini encountered an internal error. Please retry shortly.",
    502: "Gemini is temporarily unavailable. Please retry shortly.",
    503: "Gemini is temporarily unavailable. Please retry shortly.",
  };
  const message = status === null
    ? "Gemini could not complete your request. Please try again."
    : messages[status] ?? `Gemini request failed with HTTP ${status}. Please retry or check the server configuration.`;
  const rawDetail = error instanceof Error ? error.message : "";
  const detail = development && rawDetail
    ? rawDetail.split(apiKey).join("[redacted]").slice(0, 500)
    : undefined;
  return {
    message: development && status !== null
      ? `${message} (HTTP ${status})`
      : message,
    status,
    ...(detail ? { detail } : {}),
  };
}

export function buildGeminiChatPrompt(inputMessage: string, sourceCode?: string): string {
  const codeContext = sourceCode?.trim()
    ? `\n\nThe user also provided this JavaScript code for context:\n\`\`\`javascript\n${sourceCode}\n\`\`\``
    : "";
  return `You are CodeArena's friendly programming assistant. Answer the user's natural-language message directly and helpfully. If source code is included, use it as optional context. Do not claim to have executed code.\n\nUser message:\n${inputMessage}${codeContext}`;
}

export async function generateGeminiChatResponse(
  inputMessage: string,
  sourceCode: string | undefined,
  generateContent: (prompt: string) => Promise<string | undefined>,
): Promise<string> {
  const text = (await generateContent(buildGeminiChatPrompt(inputMessage, sourceCode)))?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }
  return text;
}
