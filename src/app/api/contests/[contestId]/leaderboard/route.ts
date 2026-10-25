import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { getFirebaseSession, isContestManager, isFirebaseAdmin } from "@/lib/firebaseSession";
import { rankContestStandings } from "@/schemas/contestSchema";
import { firestoreDocumentId } from "@/schemas/similarQuestionSchema";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ contestId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { contestId } = await params;
  if (!firestoreDocumentId.safeParse(contestId).success) {
    return NextResponse.json({ success: false, message: "Invalid contest ID." }, { status: 400 });
  }
  const contestRef = adminFirestore.collection("contests").doc(contestId);
  const contest = await contestRef.get();
  if (!contest.exists) {
    return NextResponse.json({ success: false, message: "Contest not found." }, { status: 404 });
  }
  const session = await getFirebaseSession(request);
  const manager = session?.uid && (await isContestManager(session.uid))
    ? session.uid === contest.get("ownerUid") || (await isFirebaseAdmin(session.uid))
    : false;
  if (contest.get("status") !== "published" && !manager) {
    return NextResponse.json({ success: false, message: "Contest not found." }, { status: 404 });
  }
  const participants = await contestRef.collection("participants").limit(500).get();
  const standings = rankContestStandings(
    participants.docs.map((participant) => {
      const data = participant.data();
      return {
        uid: participant.id,
        username: String(data.username ?? "CodeArena user"),
        score: Number(data.score ?? 0),
        solvedCount: Array.isArray(data.solvedProblemIds) ? data.solvedProblemIds.length : 0,
        joinedAt: String(data.joinedAt ?? ""),
        scoreAchievedAt:
          typeof data.scoreAchievedAt === "string" ? data.scoreAchievedAt : null,
      };
    }),
  ).map((standing) => ({
    rank: standing.rank,
    username: standing.username,
    score: standing.score,
    solvedCount: standing.solvedCount,
    joinedAt: standing.joinedAt,
    scoreAchievedAt: standing.scoreAchievedAt,
  }));
  return NextResponse.json({ success: true, leaderboard: standings });
}
