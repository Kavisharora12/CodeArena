import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { getFirebaseSession } from "@/lib/firebaseSession";

export async function POST(req: NextRequest) {
  const session = await getFirebaseSession(req);
  if (!session?.uid) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const snapshot = await adminFirestore
      .collection("submissions")
      .where("userId", "==", session.uid)
      .get();
    const sortedSnapshots = [...snapshot.docs].sort((left, right) =>
      String(right.get("createdAt")).localeCompare(String(left.get("createdAt"))),
    );
    const submissions = await Promise.all(
      sortedSnapshots.map(async (submissionSnapshot) => {
        const submission = submissionSnapshot.data();
        const problemId =
          typeof submission.problemId === "string" ? submission.problemId : "";
        const problemSnapshot = problemId
          ? await adminFirestore.collection("problems").doc(problemId).get()
          : null;

        return {
          _id: submissionSnapshot.id,
          ...submission,
          problemId: problemSnapshot?.exists
            ? { _id: problemSnapshot.id, ...problemSnapshot.data() }
            : problemId,
        };
      }),
    );
    return NextResponse.json(
      {
        success: true,
        message: "All submissions are fetched successfully",
        submissions,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Something went wrong while fetching submissions:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to fetch submissions" },
      { status: 500 },
    );
  }
}
