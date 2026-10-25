import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { getFirebaseSession } from "@/lib/firebaseSession";
import { firestoreDocumentId } from "@/schemas/similarQuestionSchema";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ problemId: string; discussionId: string }> },
) {
  const session = await getFirebaseSession(request);
  if (!session?.uid) {
    return NextResponse.json(
      { success: false, message: "Sign in to vote on a discussion." },
      { status: 401 },
    );
  }

  const { problemId, discussionId } = await params;
  if (
    !firestoreDocumentId.safeParse(problemId).success ||
    !firestoreDocumentId.safeParse(discussionId).success
  ) {
    return NextResponse.json(
      { success: false, message: "Invalid problem or discussion ID." },
      { status: 400 },
    );
  }

  try {
    const postRef = adminFirestore
      .collection("problems")
      .doc(problemId)
      .collection("discussions")
      .doc(discussionId);
    const voteRef = postRef.collection("votes").doc(session.uid);
    const voted = await adminFirestore.runTransaction(async (transaction) => {
      const [post, vote] = await Promise.all([
        transaction.get(postRef),
        transaction.get(voteRef),
      ]);
      if (!post.exists || post.get("isDeleted")) {
        throw new Error("DISCUSSION_NOT_FOUND");
      }
      if (vote.exists) {
        transaction.delete(voteRef);
        transaction.update(postRef, {
          votesCount: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return false;
      }
      transaction.create(voteRef, {
        uid: session.uid,
        createdAt: FieldValue.serverTimestamp(),
      });
      transaction.update(postRef, {
        votesCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return true;
    });

    const post = await postRef.get();
    return NextResponse.json({
      success: true,
      message: voted ? "Upvoted discussion." : "Upvote removed.",
      hasVoted: voted,
      votesCount: post.get("votesCount") ?? 0,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DISCUSSION_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Discussion not found." },
        { status: 404 },
      );
    }
    console.error(
      "Unable to toggle discussion vote:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to update your vote." },
      { status: 500 },
    );
  }
}
