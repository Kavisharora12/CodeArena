import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ solutionId: string }> },
) {
  try {
    const { solutionId } = await params;
    const solutionSnapshot = await adminFirestore
      .collection("solutions")
      .doc(solutionId)
      .get();
    if (!solutionSnapshot.exists) {
      return NextResponse.json(
        { success: false, message: "Solution not found" },
        { status: 404 },
      );
    }

    const solution = solutionSnapshot.data() ?? {};
    const userId = typeof solution.userId === "string" ? solution.userId : "";
    const userSnapshot = userId
      ? await adminFirestore.collection("users").doc(userId).get()
      : null;

    return NextResponse.json(
      {
        success: true,
        message: "Solution fetched successfully",
        solution: {
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
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Something went wrong while fetching solution:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to fetch the solution" },
      { status: 500 },
    );
  }
}
