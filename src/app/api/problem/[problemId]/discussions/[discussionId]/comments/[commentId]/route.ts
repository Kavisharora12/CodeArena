import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { getFirebaseSession, isFirebaseAdmin } from "@/lib/firebaseSession";
import { discussionCommentEditSchema } from "@/schemas/discussionSchema";
import { firestoreDocumentId } from "@/schemas/similarQuestionSchema";

type RouteContext = {
  params: Promise<{ problemId: string; discussionId: string; commentId: string }>;
};

function validIds(problemId: string, discussionId: string, commentId: string) {
  return [problemId, discussionId, commentId].every((id) =>
    firestoreDocumentId.safeParse(id).success,
  );
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getFirebaseSession(request);
  if (!session?.uid) {
    return NextResponse.json(
      { success: false, message: "Sign in to edit a reply." },
      { status: 401 },
    );
  }
  const { problemId, discussionId, commentId } = await params;
  if (!validIds(problemId, discussionId, commentId)) {
    return NextResponse.json(
      { success: false, message: "Invalid problem, discussion, or reply ID." },
      { status: 400 },
    );
  }

  try {
    const parsed = discussionCommentEditSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? "Invalid reply." },
        { status: 400 },
      );
    }
    const commentRef = adminFirestore
      .collection("problems")
      .doc(problemId)
      .collection("discussions")
      .doc(discussionId)
      .collection("comments")
      .doc(commentId);
    const snapshot = await commentRef.get();
    if (!snapshot.exists || snapshot.get("isDeleted")) {
      return NextResponse.json(
        { success: false, message: "Reply not found." },
        { status: 404 },
      );
    }
    if (
      snapshot.get("authorUid") !== session.uid &&
      !(await isFirebaseAdmin(session.uid))
    ) {
      return NextResponse.json(
        { success: false, message: "You can only edit your own replies." },
        { status: 403 },
      );
    }

    await commentRef.update({
      content: parsed.data.content,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true, message: "Reply updated." });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: "Request body must be valid JSON." },
        { status: 400 },
      );
    }
    console.error(
      "Unable to edit discussion reply:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to update this reply." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await getFirebaseSession(request);
  if (!session?.uid) {
    return NextResponse.json(
      { success: false, message: "Sign in to delete a reply." },
      { status: 401 },
    );
  }
  const { problemId, discussionId, commentId } = await params;
  if (!validIds(problemId, discussionId, commentId)) {
    return NextResponse.json(
      { success: false, message: "Invalid problem, discussion, or reply ID." },
      { status: 400 },
    );
  }

  try {
    const discussionRef = adminFirestore
      .collection("problems")
      .doc(problemId)
      .collection("discussions")
      .doc(discussionId);
    const commentRef = discussionRef.collection("comments").doc(commentId);
    const admin = await isFirebaseAdmin(session.uid);
    const decremented = await adminFirestore.runTransaction(async (transaction) => {
      const [discussion, comment, childComments] = await Promise.all([
        transaction.get(discussionRef),
        transaction.get(commentRef),
        transaction.get(
          discussionRef
            .collection("comments")
            .where("parentCommentId", "==", commentId)
            .limit(1),
        ),
      ]);
      if (!discussion.exists || !comment.exists || comment.get("isDeleted")) {
        throw new Error("REPLY_NOT_FOUND");
      }
      if (comment.get("authorUid") !== session.uid && !admin) {
        throw new Error("FORBIDDEN");
      }
      if (!childComments.empty) {
        transaction.update(commentRef, {
          content: "",
          isDeleted: true,
          deletedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return false;
      }
      transaction.delete(commentRef);
      transaction.update(discussionRef, {
        commentsCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return true;
    });
    return NextResponse.json({
      success: true,
      message: "Reply deleted.",
      removedFromCount: decremented,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "REPLY_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Reply not found." },
        { status: 404 },
      );
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, message: "You can only delete your own replies." },
        { status: 403 },
      );
    }
    console.error(
      "Unable to delete discussion reply:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to delete this reply." },
      { status: 500 },
    );
  }
}
