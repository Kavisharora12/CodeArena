import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { getFirebaseSession, isContestManager, isFirebaseAdmin } from "@/lib/firebaseSession";
import { hashContestAccessCode } from "@/lib/contestAccessCode";
import { contestPublicFields } from "@/lib/contestPublicData";
import {
  contestCreateRequestSchema,
  findMissingContestProblemIndex,
} from "@/schemas/contestSchema";
import { parseBoundedJson } from "@/schemas/codeExecutionSchema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope");
  if (scope === "mine") {
    const session = await getFirebaseSession(request);
    if (!session?.uid) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (!(await isContestManager(session.uid))) {
      return NextResponse.json({ success: false, message: "Teacher access is required." }, { status: 403 });
    }
    const isAdmin = await isFirebaseAdmin(session.uid);
    const query = isAdmin
      ? adminFirestore.collection("contests")
      : adminFirestore.collection("contests").where("ownerUid", "==", session.uid);
    const snapshot = await query.limit(100).get();
    const contests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...contestPublicFields(doc.data()),
    }));
    return NextResponse.json({
      success: true,
      contests: contests.sort((left, right) =>
        String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? "")),
      ),
    });
  }

  const snapshot = await adminFirestore
    .collection("contests")
    .where("status", "==", "published")
    .limit(100)
    .get();
  const now = Date.now();
  const contests = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        problemIds: data.problemIds,
        hasAccessCode: Boolean(data.accessCodeHash),
        status:
          now < Date.parse(data.startsAt)
            ? "upcoming"
            : now < Date.parse(data.endsAt)
              ? "live"
              : "ended",
      };
    })
    .sort((left, right) => String(left.startsAt).localeCompare(String(right.startsAt)));
  return NextResponse.json({ success: true, contests });
}

export async function POST(request: NextRequest) {
  const session = await getFirebaseSession(request);
  if (!session?.uid) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  if (!(await isContestManager(session.uid))) {
    return NextResponse.json({ success: false, message: "Only teachers and admins can create contests." }, { status: 403 });
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
  const parsed = contestCreateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message ?? "Invalid contest." }, { status: 400 });
  }
  if (Date.parse(parsed.data.startsAt) <= Date.now()) {
    return NextResponse.json({ success: false, message: "Contest start time must be in the future." }, { status: 400 });
  }

  const problemSnapshots = await Promise.all(
    parsed.data.problemIds.map((id) => adminFirestore.collection("problems").doc(id).get()),
  );
  const missingProblemIndex = findMissingContestProblemIndex(
    parsed.data.problemIds,
    problemSnapshots.filter((problem) => problem.exists).map((problem) => problem.id),
  );
  if (missingProblemIndex >= 0) {
    return NextResponse.json(
      { success: false, message: `Selected problem ${parsed.data.problemIds[missingProblemIndex]} does not exist.` },
      { status: 400 },
    );
  }

  const userSnapshot = await adminFirestore.collection("users").doc(session.uid).get();
  const accessCode = parsed.data.accessCode?.trim();
  const accessCodeCredentials = accessCode ? hashContestAccessCode(accessCode) : null;
  const contestId = randomBytes(16).toString("hex");
  const timestamp = new Date().toISOString();
  const contest = {
    title: parsed.data.title,
    description: parsed.data.description,
    instructions: parsed.data.instructions,
    startsAt: new Date(parsed.data.startsAt).toISOString(),
    endsAt: new Date(parsed.data.endsAt).toISOString(),
    problemIds: parsed.data.problemIds,
    ownerUid: session.uid,
    ownerName: userSnapshot.get("username") ?? session.name ?? "Teacher",
    status: "draft",
    scorePerProblem: 100,
    ...(accessCodeCredentials
      ? {
          accessCodeSalt: accessCodeCredentials.salt,
          accessCodeHash: accessCodeCredentials.hash,
        }
      : {}),
    createdAt: timestamp,
    updatedAt: timestamp,
    publishedAt: null,
    cancelledAt: null,
  };
  await adminFirestore.collection("contests").doc(contestId).create(contest);

  return NextResponse.json(
    { success: true, message: "Contest created as a draft.", contest: { id: contestId, ...contest, hasAccessCode: Boolean(accessCodeCredentials) } },
    { status: 201 },
  );
}
