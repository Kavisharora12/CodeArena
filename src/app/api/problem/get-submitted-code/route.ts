import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { getFirebaseSession } from "@/lib/firebaseSession";
import { firestoreDocumentId } from "@/schemas/similarQuestionSchema";

export async function GET(req: NextRequest) {
  const session = await getFirebaseSession(req);
  if (!session?.uid) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const problemId = new URL(req.url).searchParams.get("problemId");
  if (!problemId || !firestoreDocumentId.safeParse(problemId).success) {
    return NextResponse.json(
      { success: false, message: "A valid problem ID is required" },
      { status: 400 },
    );
  }

  try {
    const problem = await adminFirestore.collection("problems").doc(problemId).get();
    if (!problem.exists) {
      return NextResponse.json(
        { success: false, message: "Problem not found" },
        { status: 404 },
      );
    }

    const submissions = await adminFirestore
      .collection("submissions")
      .where("userId", "==", session.uid)
      .get();
    const submittedCodes = submissions.docs
      .filter((submission) => submission.get("problemId") === problemId)
      .sort((left, right) =>
        String(right.get("createdAt")).localeCompare(String(left.get("createdAt"))),
      )
      .map((submission) => ({ _id: submission.id, ...submission.data() }));

    return NextResponse.json({
      success: true,
      message: "Submission fetched successfully",
      submissions: submittedCodes,
    });
  } catch (error) {
    console.error(
      "Something went wrong while fetching submissions for this problem:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to fetch submissions for this problem" },
      { status: 500 },
    );
  }
}
