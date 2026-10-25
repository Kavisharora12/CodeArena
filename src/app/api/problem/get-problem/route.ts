import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { getFirebaseSession, isFirebaseAdmin } from "@/lib/firebaseSession";
import { firestoreDocumentId } from "@/schemas/similarQuestionSchema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const problemId = new URL(req.url).searchParams.get("problemId");
  if (!problemId) {
    return NextResponse.json(
      { success: false, message: "Problem ID is required" },
      { status: 400 },
    );
  }
  if (!firestoreDocumentId.safeParse(problemId).success) {
    return NextResponse.json(
      { success: false, message: "Invalid problem ID" },
      { status: 400 },
    );
  }

  try {
    const problemSnapshot = await adminFirestore
      .collection("problems")
      .doc(problemId)
      .get();
    if (!problemSnapshot.exists) {
      return NextResponse.json(
        { success: false, message: "Problem not found" },
        { status: 404 },
      );
    }

    const data = problemSnapshot.data() ?? {};
    const session = await getFirebaseSession(req);
    const isAdmin = session?.uid ? await isFirebaseAdmin(session.uid) : false;
    const responseProblem = { ...data };
    if (!isAdmin) delete responseProblem.testCases;
    return NextResponse.json(
      {
        success: true,
        message: "Problem found successfully",
        problem: {
          _id: problemSnapshot.id,
          ...responseProblem,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Something went wrong while fetching the problem:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to fetch the problem" },
      { status: 500 },
    );
  }
}
