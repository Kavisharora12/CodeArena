import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { acquireExecutionSlot, consumeExecutionRateLimit } from "@/lib/executionGuard";
import { getFirebaseSession } from "@/lib/firebaseSession";
import { runJavaScript } from "@/lib/javascriptRunner";
import { gradeExecutionResults } from "@/lib/codeGrading";
import { contestProblemAward } from "@/lib/contestScoring";
import {
  codeSubmitRequestSchema,
  parseBoundedJson,
  storedTestCaseSchema,
} from "@/schemas/codeExecutionSchema";
import { isContestWindowOpen } from "@/schemas/contestSchema";

export const runtime = "nodejs";
const MAX_REQUEST_BYTES = 100 * 1024;
const MAX_TEST_CASES = 30;

export async function POST(req: NextRequest) {
  const session = await getFirebaseSession(req);
  if (!session?.uid) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }
  if (!consumeExecutionRateLimit(session.uid, 3)) {
    return NextResponse.json(
      { success: false, message: "Submit limit reached. Try again in a minute." },
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
  const parsed = codeSubmitRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0]?.message ?? "Invalid submit request." },
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
    const problemRef = adminFirestore.collection("problems").doc(parsed.data.problemId);
    const userRef = adminFirestore.collection("users").doc(session.uid);
    const [problemSnapshot, userSnapshot] = await Promise.all([problemRef.get(), userRef.get()]);
    if (!problemSnapshot.exists) {
      return NextResponse.json({ success: false, message: "Problem not found." }, { status: 404 });
    }
    if (!userSnapshot.exists) {
      return NextResponse.json({ success: false, message: "User profile not found." }, { status: 404 });
    }

    const contestRef = parsed.data.contestId
      ? adminFirestore.collection("contests").doc(parsed.data.contestId)
      : null;
    const participantRef = contestRef
      ? contestRef.collection("participants").doc(session.uid)
      : null;
    if (contestRef && participantRef) {
      const [contestSnapshot, participantSnapshot] = await Promise.all([
        contestRef.get(),
        participantRef.get(),
      ]);
      if (!contestSnapshot.exists) {
        return NextResponse.json({ success: false, message: "Contest not found." }, { status: 404 });
      }
      if (!isContestWindowOpen(contestSnapshot.data()!)) {
        return NextResponse.json({ success: false, message: "Contest submissions are outside the permitted time window." }, { status: 409 });
      }
      if (!(contestSnapshot.get("problemIds") as string[]).includes(parsed.data.problemId)) {
        return NextResponse.json({ success: false, message: "This problem is not part of the contest." }, { status: 400 });
      }
      if (!participantSnapshot.exists) {
        return NextResponse.json({ success: false, message: "Join the contest before submitting." }, { status: 403 });
      }
    }

    const casesValue = problemSnapshot.get("testCases");
    if (!Array.isArray(casesValue) || casesValue.length === 0 || casesValue.length > MAX_TEST_CASES) {
      return NextResponse.json(
        { success: false, message: `Problem test cases must contain 1 to ${MAX_TEST_CASES} cases.` },
        { status: 500 },
      );
    }
    const cases = casesValue.map((testCase) => storedTestCaseSchema.safeParse(testCase));
    const invalidCaseIndex = cases.findIndex((result) => !result.success);
    if (invalidCaseIndex >= 0) {
      return NextResponse.json(
        { success: false, message: `Stored test case ${invalidCaseIndex + 1} is invalid or exceeds execution limits.` },
        { status: 500 },
      );
    }

    const runResults = [];
    for (const [index, testCase] of cases.entries()) {
      if (!testCase.success) continue;
      runResults.push({
        testCaseNumber: index + 1,
        run: await runJavaScript({
          sourceCode: parsed.data.sourceCode,
          input: testCase.data.input,
        }),
        expected: testCase.data.output,
      });
    }

    const { passedTestCases, totalTestCases, allPassed, status } =
      gradeExecutionResults(runResults);
    const firstExecutionFailure = runResults.find(({ run }) => run.status !== "Finished");
    const redactTestCaseData = (value: string, testCaseNumber: number) => {
      const testCase = cases[testCaseNumber - 1];
      if (!testCase?.success) return value;
      return [testCase.data.input, testCase.data.output]
        .filter((secret) => secret.length > 0)
        .reduce(
          (message, secret) => message.split(secret).join("[hidden test data]"),
          value,
        );
    };
    const executionDiagnostic =
      process.env.NODE_ENV === "development" && firstExecutionFailure
        ? {
            testCaseNumber: firstExecutionFailure.testCaseNumber,
            status: firstExecutionFailure.run.status,
            exitCode: firstExecutionFailure.run.exitCode,
            runtimeMs: firstExecutionFailure.run.runtimeMs,
            error: redactTestCaseData(
              firstExecutionFailure.run.error ?? "",
              firstExecutionFailure.testCaseNumber,
            ),
            stderr: redactTestCaseData(
              firstExecutionFailure.run.stderr,
              firstExecutionFailure.testCaseNumber,
            ).slice(0, 8 * 1024),
          }
        : undefined;
    if (executionDiagnostic) {
      console.warn("JavaScript test case execution failed.", executionDiagnostic);
    }
    const totalRuntimeSeconds =
      runResults.reduce((total, result) => total + result.run.runtimeMs, 0) / 1000;
    const submissionRef = adminFirestore.collection("submissions").doc();
    const createdAt = new Date().toISOString();
    const submission = {
      userId: session.uid,
      status,
      language: "JavaScript",
      time: totalRuntimeSeconds,
      memory: null,
      sourceCode: parsed.data.sourceCode,
      problemId: parsed.data.problemId,
      ...(parsed.data.contestId ? { contestId: parsed.data.contestId } : {}),
      passedTestCases,
      totalTestCases,
      createdAt,
    };

    await adminFirestore.runTransaction(async (transaction) => {
      const [currentUser, currentContest, currentParticipant] = await Promise.all([
        transaction.get(userRef),
        contestRef ? transaction.get(contestRef) : Promise.resolve(null),
        participantRef ? transaction.get(participantRef) : Promise.resolve(null),
      ]);
      if (!currentUser.exists) throw new Error("USER_NOT_FOUND");
      if (
        contestRef &&
        participantRef &&
        (!currentContest?.exists ||
          !isContestWindowOpen(currentContest.data()!) ||
          !currentParticipant?.exists)
      ) {
        throw new Error("CONTEST_WINDOW_CLOSED");
      }
      if (
        contestRef &&
        currentContest?.exists &&
        !(currentContest.get("problemIds") as string[]).includes(parsed.data.problemId)
      ) {
        throw new Error("CONTEST_PROBLEM_INVALID");
      }

      const update: Record<string, unknown> = {
        submissions: FieldValue.arrayUnion(submissionRef.id),
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (allPassed) {
        const solved = currentUser.get("solvedQuestions");
        if (!Array.isArray(solved) || !solved.includes(parsed.data.problemId)) {
          update.solvedQuestions = FieldValue.arrayUnion(parsed.data.problemId);
          update.solvedProblems = FieldValue.increment(1);
        }
      }
      if (
        allPassed &&
        currentContest?.exists &&
        currentParticipant?.exists
      ) {
        const award = contestProblemAward(
          currentParticipant.get("solvedProblemIds"),
          parsed.data.problemId,
          currentContest.get("scorePerProblem"),
        );
        if (award) {
          transaction.update(participantRef!, {
            solvedProblemIds: FieldValue.arrayUnion(award.problemId),
            score: FieldValue.increment(award.points),
            scoreAchievedAt: createdAt,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }
      transaction.create(submissionRef, submission);
      transaction.update(userRef, update);
    });

    return NextResponse.json(
      {
        success: true,
        message: allPassed ? "All test cases passed." : "Some test cases failed.",
        passedTestCases,
        totalTestCases,
        ...(executionDiagnostic ? { executionDiagnostic } : {}),
        submissionOutput: { _id: submissionRef.id, ...submission },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ success: false, message: "User profile not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "CONTEST_WINDOW_CLOSED") {
      return NextResponse.json({ success: false, message: "Contest ended before this submission could be recorded." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "CONTEST_PROBLEM_INVALID") {
      return NextResponse.json({ success: false, message: "This problem is no longer part of the contest." }, { status: 409 });
    }
    const errorCode =
      error && typeof error === "object" && "code" in error
        ? error.code
        : undefined;
    const errorMessage = error instanceof Error ? error.message : "";
    console.error(
      "JavaScript submission failed:",
      error instanceof Error
        ? { name: error.name, code: errorCode, message: errorMessage }
        : error,
    );
    if (
      errorMessage.includes("Do not run the local code runner from an elevated Windows session.")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Code execution is blocked in an elevated Windows session. Close the server and restart it from a normal, non-Administrator PowerShell window.",
        },
        { status: 503 },
      );
    }
    if (errorMessage.includes("requires Node.js")) {
      return NextResponse.json(
        { success: false, message: "Code execution requires Node.js 20.13+ or 22+." },
        { status: 503 },
      );
    }
    if (errorCode === 7 || errorCode === "permission-denied") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Firebase Admin cannot access Firestore. Check that the server service account has the Cloud Datastore User role.",
        },
        { status: 503 },
      );
    }
    if (errorCode === 5 || errorCode === "not-found") {
      return NextResponse.json(
        {
          success: false,
          message: "Firestore could not find the requested database or document. Check Firebase setup and problem data.",
        },
        { status: 503 },
      );
    }
    if (errorCode === 14 || errorCode === "unavailable") {
      return NextResponse.json(
        { success: false, message: "Firestore is temporarily unavailable. Please retry shortly." },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { success: false, message: "Unable to grade or save this submission." },
      { status: 500 },
    );
  } finally {
    releaseSlot();
  }
}
