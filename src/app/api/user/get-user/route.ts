import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { getFirebaseSession } from "@/lib/firebaseSession";

export async function GET(req: NextRequest) {
  const session = await getFirebaseSession(req);
  if (!session?.uid) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const userSnapshot = await adminFirestore
      .collection("users")
      .doc(session.uid)
      .get();
    if (!userSnapshot.exists) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const user = userSnapshot.data() ?? {};
    const solvedQuestionIds = Array.isArray(user.solvedQuestions)
      ? user.solvedQuestions.filter(
          (problemId): problemId is string => typeof problemId === "string",
        )
      : [];
    const solvedQuestions = await Promise.all(
      solvedQuestionIds.map(async (problemId) => {
        const problemSnapshot = await adminFirestore
          .collection("problems")
          .doc(problemId)
          .get();
        return problemSnapshot.exists
          ? { _id: problemSnapshot.id, ...problemSnapshot.data() }
          : null;
      }),
    );

    return NextResponse.json(
      {
        success: true,
        message: "User found successfully",
        user: {
          uid: userSnapshot.id,
          ...user,
          solvedQuestions: solvedQuestions.filter((problem) => problem !== null),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Something went wrong while fetching user info:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to fetch user information" },
      { status: 500 },
    );
  }
}
