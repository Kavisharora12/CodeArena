import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import {
  getDiscussionAuthors,
  makeSearchTerms,
  serializeDiscussion,
} from "@/lib/discussions";
import { getFirebaseSession } from "@/lib/firebaseSession";
import type { IDiscussion } from "@/models/Discussion";
import { discussionContentSchema } from "@/schemas/discussionSchema";
import { firestoreDocumentId } from "@/schemas/similarQuestionSchema";

const pageSize = 20;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ problemId: string }> },
) {
  const { problemId } = await params;
  if (!firestoreDocumentId.safeParse(problemId).success) {
    return NextResponse.json(
      { success: false, message: "A valid problem ID is required." },
      { status: 400 },
    );
  }

  const queryParams = request.nextUrl.searchParams;
  const sort = queryParams.get("sort") ?? "newest";
  const search = (queryParams.get("q") ?? "").trim().toLocaleLowerCase();
  if (!["newest", "upvoted", "discussed"].includes(sort)) {
    return NextResponse.json(
      { success: false, message: "Invalid discussion sort order." },
      { status: 400 },
    );
  }
  if (search.length > 100) {
    return NextResponse.json(
      { success: false, message: "Search text is too long." },
      { status: 400 },
    );
  }

  try {
    const discussions = adminFirestore
      .collection("problems")
      .doc(problemId)
      .collection("discussions");
    const orderField =
      sort === "upvoted" ? "votesCount" : sort === "discussed" ? "commentsCount" : "createdAt";
    const queryTerms = search ? makeSearchTerms(search, "").slice(0, 10) : [];

    if (search && !queryTerms.length) {
      return NextResponse.json({
        success: true,
        message: "No matching discussions.",
        discussions: [],
        nextCursor: null,
        hasMore: false,
      });
    }

    const buildQuery = () => {
      if (search && queryTerms.length) {
        return discussions
          .where("searchTerms", "array-contains-any", queryTerms)
          .orderBy(orderField, "desc")
          .orderBy(FieldPath.documentId(), "desc");
      }

      return discussions.orderBy("createdAt", "desc").orderBy(FieldPath.documentId(), "desc");
    };

    let query = buildQuery();
    const cursor = queryParams.get("cursor");
    if (cursor) {
      if (!firestoreDocumentId.safeParse(cursor).success) {
        return NextResponse.json(
          { success: false, message: "Invalid discussion pagination cursor." },
          { status: 400 },
        );
      }
      const cursorSnapshot = await discussions.doc(cursor).get();
      if (!cursorSnapshot.exists) {
        return NextResponse.json(
          { success: false, message: "Discussion pagination cursor was not found." },
          { status: 400 },
        );
      }
      query = query.startAfter(cursorSnapshot);
    }

    let snapshot;
    try {
      snapshot = await query.limit(pageSize + 1).get();
    } catch (queryError) {
      const message = queryError instanceof Error ? queryError.message : "";
      if (message.includes("requires an index") || message.includes("index") || message.includes("FAILED_PRECONDITION")) {
        const fallbackQuery = discussions.orderBy("createdAt", "desc").orderBy(FieldPath.documentId(), "desc");
        const fallbackCursor = queryParams.get("cursor");
        if (fallbackCursor) {
          const fallbackSnapshot = await discussions.doc(fallbackCursor).get();
          if (fallbackSnapshot.exists) {
            snapshot = await fallbackQuery.startAfter(fallbackSnapshot).limit(pageSize + 1).get();
          } else {
            snapshot = await fallbackQuery.limit(pageSize + 1).get();
          }
        } else {
          snapshot = await fallbackQuery.limit(pageSize + 1).get();
        }
      } else {
        throw queryError;
      }
    }

    let pageDocs = snapshot.docs.slice(0, pageSize);
    pageDocs = pageDocs.filter((post) => !post.get("isDeleted"));

    if (search && queryTerms.length) {
      pageDocs = pageDocs.filter((post) => {
        const combined = `${post.get("title") ?? ""} ${post.get("content") ?? ""}`.toLowerCase();
        return queryTerms.some((term) => combined.includes(term));
      });
    }

    if (sort === "upvoted") {
      pageDocs = [...pageDocs].sort((a, b) => Number(b.get("votesCount") ?? 0) - Number(a.get("votesCount") ?? 0));
    }
    if (sort === "discussed") {
      pageDocs = [...pageDocs].sort((a, b) => Number(b.get("commentsCount") ?? 0) - Number(a.get("commentsCount") ?? 0));
    }

    const authors = await getDiscussionAuthors(
      pageDocs.map((post) => post.get("authorUid") as string),
    );
    const session = await getFirebaseSession(request);
    const voteSnapshots = session?.uid
      ? await adminFirestore.getAll(
          ...pageDocs.map((post) =>
            post.ref.collection("votes").doc(session.uid),
          ),
        )
      : [];
    const votesByPost = new Map(
      voteSnapshots.map((vote) => [vote.ref.parent.parent?.id ?? "", vote.exists]),
    );

    const results = pageDocs.map((post) =>
      serializeDiscussion(
        post,
        authors.get(post.get("authorUid") as string) ?? null,
        votesByPost.get(post.id) ?? false,
      ) as IDiscussion,
    );

    const nextCursor = snapshot.docs.length > pageSize ? snapshot.docs[pageSize - 1]?.id ?? null : null;

    return NextResponse.json({
      success: true,
      message: "Discussions fetched successfully.",
      discussions: results,
      nextCursor,
      hasMore: snapshot.docs.length > pageSize,
    });
  } catch (error) {
    console.error(
      "Unable to fetch problem discussions:",
      error instanceof Error ? { name: error.name, message: error.message } : error,
    );
    return NextResponse.json(
      { success: false, message: "Unable to fetch discussions. Please try again." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ problemId: string }> },
) {
  const session = await getFirebaseSession(request);
  if (!session?.uid) {
    return NextResponse.json(
      { success: false, message: "Sign in to start a discussion." },
      { status: 401 },
    );
  }

  const { problemId } = await params;
  if (!firestoreDocumentId.safeParse(problemId).success) {
    return NextResponse.json(
      { success: false, message: "A valid problem ID is required." },
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

    const { title, content, tags } = parsed.data;
    const problemRef = adminFirestore.collection("problems").doc(problemId);
    const userRef = adminFirestore.collection("users").doc(session.uid);
    const discussionRef = problemRef.collection("discussions").doc();
    const now = FieldValue.serverTimestamp();
    let author: { uid: string; username: string; avatar: string } | null = null;

    await adminFirestore.runTransaction(async (transaction) => {
      const [problem, user] = await Promise.all([
        transaction.get(problemRef),
        transaction.get(userRef),
      ]);
      if (!problem.exists) throw new Error("PROBLEM_NOT_FOUND");
      if (!user.exists) throw new Error("USER_NOT_FOUND");

      author = {
        uid: session.uid,
        username: user.get("username") ?? "CodeArena user",
        avatar: user.get("avatar") ?? "",
      };
      transaction.create(discussionRef, {
        problemId,
        authorUid: session.uid,
        title,
        content,
        tags: Array.from(new Set(tags)),
        searchTerms: makeSearchTerms(title, content),
        votesCount: 0,
        commentsCount: 0,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });
    });

    const timestamp = new Date().toISOString();
    const responseDiscussion: IDiscussion = {
      _id: discussionRef.id,
      problemId,
      authorUid: session.uid,
      author,
      title,
      content,
      tags: Array.from(new Set(tags)),
      votesCount: 0,
      commentsCount: 0,
      hasVoted: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return NextResponse.json(
      {
        success: true,
        message: "Discussion created successfully.",
        discussion: responseDiscussion,
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
    if (error instanceof Error && error.message === "PROBLEM_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Problem not found." },
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
      "Unable to create problem discussion:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to create the discussion. Please try again." },
      { status: 500 },
    );
  }
}
