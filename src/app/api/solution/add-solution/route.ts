import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { getFirebaseSession } from "@/lib/firebaseSession";
import { solutionValidation } from "@/schemas/solutiionSchema";
import { firestoreDocumentId } from "@/schemas/similarQuestionSchema";
import { parseBoundedJson } from "@/schemas/codeExecutionSchema";
import { canPublishOfficialSolution } from "@/lib/solutionAuthorization";

const MAX_REQUEST_BYTES = 150 * 1024;

export async function POST(req: NextRequest) {
  const session = await getFirebaseSession(req);
  if (!session?.uid) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await parseBoundedJson(req, MAX_REQUEST_BYTES);
    const parsedData = solutionValidation.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { success: false, message: parsedData.error.issues[0].message },
        { status: 400 },
      );
    }

    const { problemId, title, language, tags, explanation, sourceCode, isOfficial } = parsedData.data;
    if (!firestoreDocumentId.safeParse(problemId).success) {
      return NextResponse.json(
        { success: false, message: "Invalid problem ID" },
        { status: 400 },
      );
    }

    const userRef = adminFirestore.collection("users").doc(session.uid);
    const problemRef = adminFirestore.collection("problems").doc(problemId);
    const solutionRef = adminFirestore.collection("solutions").doc();

    await adminFirestore.runTransaction(async (transaction) => {
      const [userSnapshot, problemSnapshot] = await Promise.all([
        transaction.get(userRef),
        transaction.get(problemRef),
      ]);
      if (!userSnapshot.exists) {
        throw new Error("USER_NOT_FOUND");
      }
      if (!problemSnapshot.exists) {
        throw new Error("PROBLEM_NOT_FOUND");
      }
      if (!canPublishOfficialSolution(userSnapshot.get("userType"), isOfficial)) {
        throw new Error("ADMIN_REQUIRED");
      }

      transaction.create(solutionRef, {
        userId: session.uid,
        problemId,
        tags,
        title,
        language,
        explanation,
        code: sourceCode,
        sourceCode,
        isOfficial,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      transaction.update(userRef, {
        solutions: FieldValue.arrayUnion(solutionRef.id),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(problemRef, {
        solutions: FieldValue.arrayUnion(solutionRef.id),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Solution submitted successfully",
        solution: {
          _id: solutionRef.id,
          userId: session.uid,
          problemId,
          tags,
          title,
          language,
          explanation,
          code: sourceCode,
          sourceCode,
          isOfficial,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }
    if (error instanceof Error && error.message === "PROBLEM_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Problem not found" },
        { status: 404 },
      );
    }
    if (error instanceof Error && error.message === "ADMIN_REQUIRED") {
      return NextResponse.json(
        { success: false, message: "Only admins can publish official solutions." },
        { status: 403 },
      );
    }
    if (error instanceof RangeError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 413 },
      );
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: "Request body must be valid JSON." },
        { status: 400 },
      );
    }
    console.error(
      "Something went wrong while adding solution:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to submit the solution" },
      { status: 500 },
    );
  }
}
