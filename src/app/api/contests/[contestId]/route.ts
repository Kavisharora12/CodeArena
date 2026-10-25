import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { hashContestAccessCode } from "@/lib/contestAccessCode";
import { canManageContestByRole } from "@/lib/contestAuthorization";
import { contestPublicFields } from "@/lib/contestPublicData";
import { getFirebaseSession } from "@/lib/firebaseSession";
import {
  contestUpdateRequestSchema,
} from "@/schemas/contestSchema";
import { parseBoundedJson } from "@/schemas/codeExecutionSchema";
import { firestoreDocumentId } from "@/schemas/similarQuestionSchema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ contestId: string }> };

async function canManageContestRecord(uid: string, ownerUid: string) {
  const user = await adminFirestore.collection("users").doc(uid).get();
  return user.exists && canManageContestByRole(uid, user.get("userType"), ownerUid);
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { contestId } = await params;
  if (!firestoreDocumentId.safeParse(contestId).success) {
    return NextResponse.json({ success: false, message: "Invalid contest ID." }, { status: 400 });
  }
  const contestRef = adminFirestore.collection("contests").doc(contestId);
  const snapshot = await contestRef.get();
  if (!snapshot.exists) {
    return NextResponse.json({ success: false, message: "Contest not found." }, { status: 404 });
  }
  const data = snapshot.data()!;
  const session = await getFirebaseSession(request);
  const manager = session?.uid
    ? await canManageContestRecord(session.uid, data.ownerUid)
    : false;
  const participant = session?.uid
    ? await contestRef.collection("participants").doc(session.uid).get()
    : null;
  if (data.status !== "published" && !manager) {
    return NextResponse.json({ success: false, message: "Contest not found." }, { status: 404 });
  }
  if (data.status === "cancelled" && !manager) {
    return NextResponse.json({ success: false, message: "This contest was cancelled." }, { status: 410 });
  }

  const problemSnapshots = await Promise.all(
    (data.problemIds as string[]).map((problemId) =>
      adminFirestore.collection("problems").doc(problemId).get(),
    ),
  );
  const problems = problemSnapshots
    .filter((problem) => problem.exists)
    .map((problem) => ({
      id: problem.id,
      title: problem.get("title") ?? "Untitled problem",
      difficulty: problem.get("level") ?? "Unknown",
    }));
  return NextResponse.json({
    success: true,
    contest: {
      id: snapshot.id,
      ...contestPublicFields(data),
      problems,
      isManager: manager,
      joined: Boolean(participant?.exists),
    },
  });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getFirebaseSession(request);
  if (!session?.uid) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const { contestId } = await params;
  if (!firestoreDocumentId.safeParse(contestId).success) {
    return NextResponse.json({ success: false, message: "Invalid contest ID." }, { status: 400 });
  }
  const contestRef = adminFirestore.collection("contests").doc(contestId);
  const snapshot = await contestRef.get();
  if (!snapshot.exists) {
    return NextResponse.json({ success: false, message: "Contest not found." }, { status: 404 });
  }
  const current = snapshot.data()!;
  if (!(await canManageContestRecord(session.uid, current.ownerUid))) {
    return NextResponse.json({ success: false, message: "You cannot manage this contest." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await parseBoundedJson(request, 32 * 1024);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof RangeError ? error.message : "Request body must be valid JSON." },
      { status: error instanceof RangeError ? 413 : 400 },
    );
  }
  const parsed = contestUpdateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message ?? "Invalid contest update." }, { status: 400 });
  }
  const now = Date.now();
  const update: Record<string, unknown> = { updatedAt: new Date(now).toISOString() };

  if (parsed.data.action === "cancel") {
    if (current.status === "cancelled") {
      return NextResponse.json({ success: true, message: "Contest is already cancelled." });
    }
    if (now >= Date.parse(current.endsAt)) {
      return NextResponse.json({ success: false, message: "An ended contest cannot be cancelled." }, { status: 409 });
    }
    update.status = "cancelled";
    update.cancelledAt = new Date(now).toISOString();
  } else if (parsed.data.action === "publish") {
    if (
      current.status === "cancelled" ||
      now >= Date.parse(current.startsAt) ||
      now >= Date.parse(current.endsAt)
    ) {
      return NextResponse.json({ success: false, message: "This contest can no longer be published." }, { status: 409 });
    }
    update.status = "published";
    update.publishedAt = new Date(now).toISOString();
  } else if (parsed.data.action === "unpublish") {
    if (now >= Date.parse(current.startsAt)) {
      return NextResponse.json({ success: false, message: "A contest cannot be unpublished after it starts." }, { status: 409 });
    }
    update.status = "draft";
    update.publishedAt = null;
  } else {
    if (now >= Date.parse(current.startsAt) || current.status === "cancelled") {
      return NextResponse.json({ success: false, message: "A contest can only be edited before it starts." }, { status: 409 });
    }
    const contest = parsed.data.contest;
    if (Date.parse(contest.startsAt) <= now) {
      return NextResponse.json({ success: false, message: "Contest start time must be in the future." }, { status: 400 });
    }
    const problems = await Promise.all(
      contest.problemIds.map((id) => adminFirestore.collection("problems").doc(id).get()),
    );
    if (problems.some((problem) => !problem.exists)) {
      return NextResponse.json({ success: false, message: "One or more selected problems do not exist." }, { status: 400 });
    }
    Object.assign(update, {
      title: contest.title,
      description: contest.description,
      instructions: contest.instructions,
      startsAt: new Date(contest.startsAt).toISOString(),
      endsAt: new Date(contest.endsAt).toISOString(),
      problemIds: contest.problemIds,
    });
    const newAccessCode = contest.accessCode?.trim();
    if (newAccessCode) {
      const { salt, hash } = hashContestAccessCode(newAccessCode);
      update.accessCodeSalt = salt;
      update.accessCodeHash = hash;
    } else if (parsed.data.removeAccessCode) {
      update.accessCodeHash = FieldValue.delete();
      update.accessCodeSalt = FieldValue.delete();
    }
  }

  await contestRef.update(update);
  return NextResponse.json({ success: true, message: `Contest ${parsed.data.action} successful.` });
}
