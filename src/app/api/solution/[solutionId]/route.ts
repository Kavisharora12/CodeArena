import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { getFirebaseSession } from "@/lib/firebaseSession";
import { solutionUpdateValidation } from "@/schemas/solutiionSchema";
import { firestoreDocumentId } from "@/schemas/similarQuestionSchema";
import { parseBoundedJson } from "@/schemas/codeExecutionSchema";
import { canManageSolution } from "@/lib/solutionAuthorization";

const MAX_REQUEST_BYTES = 150 * 1024;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ solutionId: string }> },
) {
  const session = await getFirebaseSession(req);
  if (!session?.uid) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { solutionId } = await params;
  if (!firestoreDocumentId.safeParse(solutionId).success) {
    return NextResponse.json({ success: false, message: "Invalid solution ID." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await parseBoundedJson(req, MAX_REQUEST_BYTES);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Invalid request body." },
      { status: error instanceof RangeError ? 413 : 400 },
    );
  }
  const parsed = solutionUpdateValidation.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0]?.message ?? "Invalid solution." },
      { status: 400 },
    );
  }

  try {
    const solutionRef = adminFirestore.collection("solutions").doc(solutionId);
    const userRef = adminFirestore.collection("users").doc(session.uid);
    await adminFirestore.runTransaction(async (transaction) => {
      const [solutionSnapshot, userSnapshot] = await Promise.all([
        transaction.get(solutionRef),
        transaction.get(userRef),
      ]);
      if (!solutionSnapshot.exists) throw new Error("SOLUTION_NOT_FOUND");

      const existing = solutionSnapshot.data()!;
      const isOfficial = parsed.data.isOfficial ?? existing.isOfficial === true;
      if (!canManageSolution(session.uid, userSnapshot.get("userType"), existing.userId, existing.isOfficial === true || isOfficial)) {
        if (existing.isOfficial === true || isOfficial) throw new Error("ADMIN_REQUIRED");
        throw new Error("FORBIDDEN");
      }

      transaction.update(solutionRef, {
        title: parsed.data.title,
        language: parsed.data.language,
        tags: parsed.data.tags,
        explanation: parsed.data.explanation,
        code: parsed.data.sourceCode,
        sourceCode: parsed.data.sourceCode,
        isOfficial,
        updatedAt: new Date().toISOString(),
      });
    });

    return NextResponse.json(
      { success: true, message: "Solution updated successfully." },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "SOLUTION_NOT_FOUND") {
      return NextResponse.json({ success: false, message: "Solution not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "ADMIN_REQUIRED") {
      return NextResponse.json(
        { success: false, message: "Only admins can publish or manage official solutions." },
        { status: 403 },
      );
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, message: "You can only edit your own community solutions." },
        { status: 403 },
      );
    }
    console.error("Unable to update solution:", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json(
      { success: false, message: "Unable to update the solution." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ solutionId: string }> },
) {
  const session = await getFirebaseSession(req);
  if (!session?.uid) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { solutionId } = await params;
  if (!firestoreDocumentId.safeParse(solutionId).success) {
    return NextResponse.json({ success: false, message: "Invalid solution ID." }, { status: 400 });
  }

  try {
    const solutionRef = adminFirestore.collection("solutions").doc(solutionId);
    const userRef = adminFirestore.collection("users").doc(session.uid);
    await adminFirestore.runTransaction(async (transaction) => {
      const [solutionSnapshot, userSnapshot] = await Promise.all([
        transaction.get(solutionRef),
        transaction.get(userRef),
      ]);
      if (!solutionSnapshot.exists) throw new Error("SOLUTION_NOT_FOUND");

      const existing = solutionSnapshot.data()!;
      if (!canManageSolution(session.uid, userSnapshot.get("userType"), existing.userId, existing.isOfficial === true)) {
        if (existing.isOfficial === true) throw new Error("ADMIN_REQUIRED");
        throw new Error("FORBIDDEN");
      }

      const problemRef =
        typeof existing.problemId === "string"
          ? adminFirestore.collection("problems").doc(existing.problemId)
          : null;
      const problemSnapshot = problemRef ? await transaction.get(problemRef) : null;
      if (userSnapshot.exists) {
        transaction.update(userRef, {
          solutions: FieldValue.arrayRemove(solutionId),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      if (problemRef && problemSnapshot?.exists) {
        transaction.update(problemRef, {
          solutions: FieldValue.arrayRemove(solutionId),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      transaction.delete(solutionRef);
    });

    return NextResponse.json({ success: true, message: "Solution deleted." }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "SOLUTION_NOT_FOUND") {
      return NextResponse.json({ success: false, message: "Solution not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "ADMIN_REQUIRED") {
      return NextResponse.json(
        { success: false, message: "Only admins can manage official solutions." },
        { status: 403 },
      );
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, message: "You can only delete your own community solutions." },
        { status: 403 },
      );
    }
    console.error("Unable to delete solution:", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json(
      { success: false, message: "Unable to delete the solution." },
      { status: 500 },
    );
  }
}
