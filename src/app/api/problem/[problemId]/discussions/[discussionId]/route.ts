import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import {
  getDiscussionAuthors,
  makeSearchTerms,
  serializeDiscussion,
} from "@/lib/discussions";
import { getFirebaseSession, isFirebaseAdmin } from "@/lib/firebaseSession";
import { discussionContentSchema } from "@/schemas/discussionSchema";
import { firestoreDocumentId } from "@/schemas/similarQuestionSchema";

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
    const ref = adminFirestore
      .collection("problems")
      .doc(problemId)
      .collection("discussions")
      .doc(discussionId);
    const [snapshot, session] = await Promise.all([
      ref.get(),
      getFirebaseSession(request),
    ]);
    if (!snapshot.exists || snapshot.get("isDeleted")) {
      return NextResponse.json(
        { success: false, message: "Discussion not found." },
        { status: 404 },
      );
    }
    const [authors, vote] = await Promise.all([
      getDiscussionAuthors([snapshot.get("authorUid") as string]),
      session?.uid ? ref.collection("votes").doc(session.uid).get() : null,
    ]);
    return NextResponse.json({
      success: true,
      discussion: serializeDiscussion(
        snapshot,
        authors.get(snapshot.get("authorUid") as string) ?? null,
        vote?.exists ?? false,
      ),
    });
  } catch (error) {
    console.error(
      "Unable to fetch discussion:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to fetch this discussion." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getFirebaseSession(request);
  if (!session?.uid) {
    return NextResponse.json(
      { success: false, message: "Sign in to edit a discussion." },
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
    const parsed = discussionContentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? "Invalid post." },
        { status: 400 },
      );
    }
    const ref = adminFirestore
      .collection("problems")
      .doc(problemId)
      .collection("discussions")
      .doc(discussionId);
    const snapshot = await ref.get();
    if (!snapshot.exists || snapshot.get("isDeleted")) {
      return NextResponse.json(
        { success: false, message: "Discussion not found." },
        { status: 404 },
      );
    }
    if (
      snapshot.get("authorUid") !== session.uid &&
      !(await isFirebaseAdmin(session.uid))
    ) {
      return NextResponse.json(
        { success: false, message: "You can only edit your own discussions." },
        { status: 403 },
      );
    }

    const { title, content, tags } = parsed.data;
    await ref.update({
      title,
      content,
      tags: Array.from(new Set(tags)),
      searchTerms: makeSearchTerms(title, content),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({
      success: true,
      message: "Discussion updated successfully.",
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: "Request body must be valid JSON." },
        { status: 400 },
      );
    }
    console.error(
      "Unable to update discussion:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to update the discussion." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await getFirebaseSession(request);
  if (!session?.uid) {
    return NextResponse.json(
      { success: false, message: "Sign in to delete a discussion." },
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
    const ref = adminFirestore
      .collection("problems")
      .doc(problemId)
      .collection("discussions")
      .doc(discussionId);
    const snapshot = await ref.get();
    if (!snapshot.exists || snapshot.get("isDeleted")) {
      return NextResponse.json(
        { success: false, message: "Discussion not found." },
        { status: 404 },
      );
    }
    if (
      snapshot.get("authorUid") !== session.uid &&
      !(await isFirebaseAdmin(session.uid))
    ) {
      return NextResponse.json(
        { success: false, message: "You can only delete your own discussions." },
        { status: 403 },
      );
    }

    await ref.update({
      title: "Deleted discussion",
      content: "",
      tags: [],
      searchTerms: [],
      votesCount: 0,
      isDeleted: true,
      deletedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({
      success: true,
      message: "Discussion deleted.",
    });
  } catch (error) {
    console.error(
      "Unable to delete discussion:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to delete the discussion." },
      { status: 500 },
    );
  }
}
