import { getFirebaseSession } from "@/lib/firebaseSession";
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { acquireExecutionSlot, consumeExecutionRateLimit } from "@/lib/executionGuard";
import { runJavaScript, MAX_EXECUTION_MS } from "@/lib/javascriptRunner";
import { codeRunRequestSchema, parseBoundedJson } from "@/schemas/codeExecutionSchema";

export const runtime = "nodejs";
const MAX_REQUEST_BYTES = 100 * 1024;

export async function POST(req: NextRequest) {
  const session = await getFirebaseSession(req);
  if (!session?.uid) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  if (!consumeExecutionRateLimit(session.uid, 10)) {
    return NextResponse.json(
      { success: false, message: "Run limit reached. Try again in a minute." },
      { status: 429 },
    );
  }
  let body: unknown;
  try {
    body = await parseBoundedJson(req, MAX_REQUEST_BYTES);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof RangeError
            ? error.message
            : "Request body must be valid JSON.",
      },
      { status: error instanceof RangeError ? 413 : 400 },
    );
  }
  const parsed = codeRunRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0]?.message ?? "Invalid run request." },
      { status: 400 },
    );
  }

  const releaseSlot = acquireExecutionSlot();
  if (!releaseSlot) {
    return NextResponse.json(
      { success: false, message: "The code runner is busy. Try again shortly." },
      { status: 429 },
    );
  }

  try {
    const problem = await adminFirestore.collection("problems").doc(parsed.data.problemId).get();
    if (!problem.exists) {
      return NextResponse.json({ success: false, message: "Problem not found." }, { status: 404 });
    }
    const result = await runJavaScript(parsed.data);
    return NextResponse.json({
      success: true,
      result,
      limits: { timeMs: MAX_EXECUTION_MS },
    });
  } catch (error) {
    console.error(
      "JavaScript run failed:",
      error instanceof Error ? { name: error.name, message: error.message } : error,
    );
    const status = error instanceof Error && /limit/iu.test(error.message) ? 413 : 500;
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to run JavaScript code.",
      },
      { status },
    );
  } finally {
    releaseSlot();
  }
}