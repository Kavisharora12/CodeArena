import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { getFirebaseSession, isFirebaseAdmin } from "@/lib/firebaseSession";
import { createProblemValidation } from "@/schemas/createProblemSchema";
import { firestoreDocumentId } from "@/schemas/similarQuestionSchema";

export async function PATCH(req: NextRequest) {
  const session = await getFirebaseSession(req);
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }
  if (!(await isFirebaseAdmin(session.uid))) {
    return NextResponse.json(
      { success: false, message: "Only admins can update problems" },
      { status: 403 },
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
    const body = await req.json();
    const parsedData = createProblemValidation.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { success: false, message: parsedData.error.issues[0].message },
        { status: 400 },
      );
    }

    const problemRef = adminFirestore.collection("problems").doc(problemId);
    const problemSnapshot = await problemRef.get();
    if (!problemSnapshot.exists) {
      return NextResponse.json(
        { success: false, message: "Problem not found" },
        { status: 404 },
      );
    }

    await problemRef.update({
      ...parsedData.data,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const updatedSnapshot = await problemRef.get();

    return NextResponse.json(
      {
        success: true,
        message: "Problem updated successfully",
        problem: { _id: updatedSnapshot.id, ...updatedSnapshot.data() },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Something went wrong while updating problem:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to update the problem" },
      { status: 500 },
    );
  }
}
