import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { firestoreDocumentId } from "@/schemas/similarQuestionSchema";

export async function GET(req: NextRequest) {
  const problemId = new URL(req.url).searchParams.get("problemId");
  if (!problemId || !firestoreDocumentId.safeParse(problemId).success) {
    return NextResponse.json(
      { success: false, message: "A valid problem ID is required" },
      { status: 400 },
    );
  }

  try {
    const snapshot = await adminFirestore
      .collection("solutions")
      .where("problemId", "==", problemId)
      .get();
    const solutions = await Promise.all(
      snapshot.docs.map(async (solutionSnapshot) => {
        const solution = solutionSnapshot.data();
        const userId = typeof solution.userId === "string" ? solution.userId : "";
        const userSnapshot = userId
          ? await adminFirestore.collection("users").doc(userId).get()
          : null;

        return {
          _id: solutionSnapshot.id,
          problemId: solution.problemId,
          title: solution.title,
          language: typeof solution.language === "string" ? solution.language : "JavaScript",
          tags: Array.isArray(solution.tags) ? solution.tags : [],
          explanation: typeof solution.explanation === "string" ? solution.explanation : "",
          code: typeof solution.code === "string" ? solution.code : solution.sourceCode ?? "",
          sourceCode: solution.sourceCode ?? solution.code ?? "",
          isOfficial: solution.isOfficial === true,
          createdAt: solution.createdAt ?? null,
          updatedAt: solution.updatedAt ?? null,
          userId: userSnapshot?.exists
            ? {
                _id: userSnapshot.id,
                username: userSnapshot.get("username"),
                avatar: userSnapshot.get("avatar"),
              }
            : null,
        };
      }),
    );

    return NextResponse.json(
      {
        success: true,
        message: "All solutions are fetched successfully",
        solutions,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Something went wrong while fetching solutions:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to fetch solutions" },
      { status: 500 },
    );
  }
}
