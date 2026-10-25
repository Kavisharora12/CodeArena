import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import {
  getDiscussionAuthors,
  serializeDiscussionComment,
} from "@/lib/discussions";
import { getFirebaseSession } from "@/lib/firebaseSession";
import { discussionCommentSchema } from "@/schemas/discussionSchema";
import { firestoreDocumentId } from "@/schemas/similarQuestionSchema";

const pageSize = 50;

type RouteContext = {
  params: Promise<{ problemId: string; discussionId: string }>;
};

function validIds(problemId: string, discussionId: string) {
  return (
    firestoreDocumentId.safeParse(problemId).success &&
    firestoreDocumentId.safeParse(discussionId).success
  );
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { problemId, discussionId } = await params;
  if (!validIds(problemId, discussionId)) {
    return NextResponse.json(
      { success: false, message: "Invalid problem or discussion ID." },
      { status: 400 },
    );
  }

  try {
    const discussionRef = adminFirestore
      .collection("problems")
      .doc(problemId)
      .collection("discussions")
      .doc(discussionId);
    const discussion = await discussionRef.get();
    if (!discussion.exists || discussion.get("isDeleted")) {
      return NextResponse.json(
        { success: false, message: "Discussion not found." },
        { status: 404 },
      );
    }

    let query = discussionRef
      .collection("comments")
      .orderBy("createdAt", "asc")
      .orderBy(FieldPath.documentId(), "asc")
      .limit(pageSize + 1);
    const cursor = request.nextUrl.searchParams.get("cursor");
    if (cursor) {
      if (!firestoreDocumentId.safeParse(cursor).success) {
        return NextResponse.json(
          { success: false, message: "Invalid comment pagination cursor." },
          { status: 400 },
        );
      }
      const cursorSnapshot = await discussionRef.collection("comments").doc(cursor).get();
      if (!cursorSnapshot.exists) {
        return NextResponse.json(
          { success: false, message: "Comment pagination cursor was not found." },
          { status: 400 },
        );
      }
      query = query.startAfter(cursorSnapshot);
    }
    const snapshot = await query.get();
    const comments = snapshot.docs.slice(0, pageSize);
    const authors = await getDiscussionAuthors(
      comments.map((comment) => comment.get("authorUid") as string),
    );
    return NextResponse.json({
      success: true,
      comments: comments.map((comment) =>
        serializeDiscussionComment(
          comment,
          authors.get(comment.get("authorUid") as string) ?? null,
        ),
      ),
      nextCursor: snapshot.docs.length > pageSize ? comments.at(-1)?.id ?? null : null,
      hasMore: snapshot.docs.length > pageSize,
    });
  } catch (error) {
    console.error(
      "Unable to fetch discussion comments:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to fetch replies." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await getFirebaseSession(request);
  if (!session?.uid) {
    return NextResponse.json(
      { success: false, message: "Sign in to reply to a discussion." },
      { status: 401 },
    );
  }

  const { problemId, discussionId } = await params;
  if (!validIds(problemId, discussionId)) {
    return NextResponse.json(
      { success: false, message: "Invalid problem or discussion ID." },
      { status: 400 },
    );
  }

  try {
    const parsed = discussionCommentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? "Invalid reply." },
        { status: 400 },
      );
    }

    const { content, parentCommentId = null } = parsed.data;
    const discussionRef = adminFirestore
      .collection("problems")
      .doc(problemId)
      .collection("discussions")
      .doc(discussionId);
    const userRef = adminFirestore.collection("users").doc(session.uid);
    const commentRef = discussionRef.collection("comments").doc();
    let author: { uid: string; username: string; avatar: string } | null = null;

    await adminFirestore.runTransaction(async (transaction) => {
      const [discussion, user] = await Promise.all([
        transaction.get(discussionRef),
        transaction.get(userRef),
      ]);
      if (!discussion.exists || discussion.get("isDeleted")) {
        throw new Error("DISCUSSION_NOT_FOUND");
      }
      if (!user.exists) throw new Error("USER_NOT_FOUND");

      if (parentCommentId) {
        const parentRef = discussionRef.collection("comments").doc(parentCommentId);
        const parent = await transaction.get(parentRef);
        if (!parent.exists || parent.get("isDeleted")) {
          throw new Error("PARENT_COMMENT_NOT_FOUND");
        }
      }

      author = {
        uid: session.uid,
        username: user.get("username") ?? "CodeArena user",
        avatar: user.get("avatar") ?? "",
      };
      transaction.create(commentRef, {
        discussionId,
        authorUid: session.uid,
        content,
        parentCommentId,
        isDeleted: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(discussionRef, {
        commentsCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    const timestamp = new Date().toISOString();
    return NextResponse.json(
      {
        success: true,
        message: "Reply added successfully.",
        comment: {
          _id: commentRef.id,
          discussionId,
          authorUid: session.uid,
          author,
          content,
          parentCommentId,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: "Request body must be valid JSON." },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === "DISCUSSION_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Discussion not found." },
        { status: 404 },
      );
    }
    if (error instanceof Error && error.message === "PARENT_COMMENT_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Reply target not found." },
        { status: 404 },
      );
    }
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Your CodeArena profile was not found." },
        { status: 404 },
      );
    }
    console.error(
      "Unable to add discussion comment:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to add your reply." },
      { status: 500 },
    );
  }
}
