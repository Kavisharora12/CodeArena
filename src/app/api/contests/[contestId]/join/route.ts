import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { verifyContestAccessCode } from "@/lib/contestAccessCode";
import { nextContestJoinAttempts } from "@/lib/contestJoinRateLimit";
import { getFirebaseSession } from "@/lib/firebaseSession";
import { contestJoinRequestSchema } from "@/schemas/contestSchema";
import { parseBoundedJson } from "@/schemas/codeExecutionSchema";
import { firestoreDocumentId } from "@/schemas/similarQuestionSchema";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ contestId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await getFirebaseSession(request);
  if (!session?.uid) {
    return NextResponse.json({ success: false, message: "Sign in to join a contest." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await parseBoundedJson(request, 1024);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof RangeError ? error.message : "Request body must be valid JSON." },
      { status: error instanceof RangeError ? 413 : 400 },
    );
  }
  const parsed = contestJoinRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Invalid access code." }, { status: 400 });
  }
  const { contestId } = await params;
  if (!firestoreDocumentId.safeParse(contestId).success) {
    return NextResponse.json({ success: false, message: "Invalid contest ID." }, { status: 400 });
  }
  const contestRef = adminFirestore.collection("contests").doc(contestId);
  const participantRef = contestRef.collection("participants").doc(session.uid);
  const existingParticipant = await participantRef.get();
  if (existingParticipant.exists) {
    return NextResponse.json({ success: true, message: "You have already joined this contest." });
  }
  const contestSnapshot = await contestRef.get();
  if (!contestSnapshot.exists || contestSnapshot.get("status") !== "published") {
    return NextResponse.json({ success: false, message: "Contest is not available to join." }, { status: 404 });
  }
  if (Date.now() >= Date.parse(contestSnapshot.get("endsAt"))) {
    return NextResponse.json({ success: false, message: "This contest has ended." }, { status: 409 });
  }
  const joinAttemptRef = contestRef.collection("joinAttempts").doc(session.uid);
  const allowedAttempts = await adminFirestore.runTransaction(async (transaction) => {
    const attemptSnapshot = await transaction.get(joinAttemptRef);
    const attempts = nextContestJoinAttempts(attemptSnapshot.get("timestamps"));
    if (!attempts) return false;
    transaction.set(joinAttemptRef, {
      timestamps: attempts,
      updatedAt: new Date().toISOString(),
    });
    return true;
  });
  if (!allowedAttempts) {
    return NextResponse.json({ success: false, message: "Too many join attempts. Try again in a few minutes." }, { status: 429 });
  }
  const accessCodeSalt = contestSnapshot.get("accessCodeSalt");
  const accessCodeHash = contestSnapshot.get("accessCodeHash");
  if (accessCodeHash) {
    const accessCode = parsed.data.accessCode ?? "";
    if (
      !accessCode ||
      !verifyContestAccessCode(
        accessCode,
        accessCodeSalt,
        accessCodeHash,
      )
    ) {
      return NextResponse.json({ success: false, message: "Incorrect access code." }, { status: 403 });
    }
  }
  const user = await adminFirestore.collection("users").doc(session.uid).get();
  const outcome = await adminFirestore.runTransaction(async (transaction) => {
    const [currentContest, currentParticipant] = await Promise.all([
      transaction.get(contestRef),
      transaction.get(participantRef),
    ]);
    if (
      !currentContest.exists ||
      currentContest.get("status") !== "published" ||
      Date.now() >= Date.parse(currentContest.get("endsAt"))
    ) {
      return { joined: false, reason: "ended" as const };
    }
    if (currentParticipant.exists) return { joined: false, reason: "joined" as const };
    const currentHash = currentContest.get("accessCodeHash");
    if (
      currentHash &&
      !verifyContestAccessCode(
        parsed.data.accessCode ?? "",
        currentContest.get("accessCodeSalt"),
        currentHash,
      )
    ) {
      return { joined: false, reason: "access-code" as const };
    }
    transaction.create(participantRef, {
      uid: session.uid,
      username: user.get("username") ?? session.name ?? "CodeArena user",
      joinedAt: new Date().toISOString(),
      solvedProblemIds: [],
      score: 0,
      scoreAchievedAt: null,
    });
    return { joined: true };
  });
  if (outcome.reason === "access-code") {
    return NextResponse.json({ success: false, message: "Incorrect access code." }, { status: 403 });
  }
  if (outcome.reason === "ended") {
    return NextResponse.json({ success: false, message: "This contest is no longer open to join." }, { status: 409 });
  }
  return NextResponse.json(
    {
      success: true,
      message: outcome.joined ? "You joined the contest." : "You have already joined this contest.",
    },
    { status: outcome.joined ? 201 : 200 },
  );
}
