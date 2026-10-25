import { z } from "zod";

import { firestoreDocumentId } from "@/schemas/similarQuestionSchema";

const utf8String = (maxBytes: number, label: string) =>
  z
    .string()
    .refine((value) => Buffer.byteLength(value, "utf8") <= maxBytes, {
      message: `${label} exceeds the ${maxBytes} byte limit.`,
    });

export const codeRunRequestSchema = z.object({
  problemId: firestoreDocumentId,
  sourceCode: utf8String(64 * 1024, "Source code").pipe(z.string().min(1)),
  input: utf8String(16 * 1024, "Input"),
});

export const codeSubmitRequestSchema = z.object({
  problemId: firestoreDocumentId,
  sourceCode: utf8String(64 * 1024, "Source code").pipe(z.string().min(1)),
  contestId: firestoreDocumentId.optional(),
});

export const storedTestCaseSchema = z.object({
  input: utf8String(16 * 1024, "Stored test input"),
  output: utf8String(16 * 1024, "Stored expected output"),
});

export async function parseBoundedJson(request: Request, maxBytes: number): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("Request body is empty.");

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new RangeError(`Request body exceeds the ${maxBytes} byte limit.`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
  return JSON.parse(body) as unknown;
}
