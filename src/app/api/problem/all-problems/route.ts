import { NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await adminFirestore.collection("problems").get();
    const allProblems = snapshot.docs.map((problem) => {
      const publicProblem = { ...problem.data() };
      delete publicProblem.testCases;
      return { _id: problem.id, ...publicProblem };
    });

    return NextResponse.json(
      {
        success: true,
        message:
          allProblems.length > 0
            ? "All the problems found successfully"
            : "No problems have been added yet.",
        allProblems,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Something went wrong while fetching all problems:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to fetch problems" },
      { status: 500 },
    );
  }
}
