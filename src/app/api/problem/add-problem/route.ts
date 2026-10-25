import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { getFirebaseSession, isFirebaseAdmin } from "@/lib/firebaseSession";
import { createProblemValidation } from "@/schemas/createProblemSchema";

export async function POST(req: NextRequest) {
  const session = await getFirebaseSession(req);
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }
  if (!(await isFirebaseAdmin(session.uid))) {
    return NextResponse.json(
      { success: false, message: "Only admins can add problems" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const parsedData = createProblemValidation.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { success: false, message: parsedData.error.issues[0].message },
        { status: 400 },
      );
    }

    const problems = adminFirestore.collection("problems");
    const existing = await problems
      .where("title", "==", parsedData.data.title)
      .limit(1)
      .get();
    if (!existing.empty) {
      return NextResponse.json(
        { success: false, message: "A problem already exists with this title" },
        { status: 409 },
      );
    }

    const countSnapshot = await problems.count().get();
    const problemId = randomBytes(12).toString("hex");
    const newProblem = {
      ...parsedData.data,
      title: `${countSnapshot.data().count + 1}. ${parsedData.data.title}`,
      like: 0,
      dislike: 0,
      similarQuestions: [],
      solutions: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await problems.doc(problemId).create(newProblem);

    return NextResponse.json(
      { success: true, message: "Problem is added", problemId },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Something went wrong while adding problem:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to add the problem" },
      { status: 500 },
    );
  }
}
