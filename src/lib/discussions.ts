import "server-only";

import type { DocumentData, DocumentSnapshot } from "firebase-admin/firestore";

import { adminFirestore } from "@/lib/firebaseAdmin";
import type { IDiscussionAuthor } from "@/models/Discussion";

export function makeSearchTerms(title: string, content: string): string[] {
  const words =
    `${title} ${content}`
      .normalize("NFKC")
      .toLocaleLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? [];
  const searchTerms = new Set<string>();
  for (const word of words) {
    searchTerms.add(word);
    for (let length = 1; length < Math.min(word.length, 25); length += 1) {
      searchTerms.add(word.slice(0, length));
    }
    if (searchTerms.size >= 3000) break;
  }
  return Array.from(searchTerms).slice(0, 3000);
}

export async function getDiscussionAuthors(
  uids: string[],
): Promise<Map<string, IDiscussionAuthor | null>> {
  const uniqueUids = Array.from(new Set(uids)).filter(Boolean);
  const refs = uniqueUids.map((uid) => adminFirestore.collection("users").doc(uid));
  const snapshots = refs.length ? await adminFirestore.getAll(...refs) : [];

  return new Map(
    snapshots.map((snapshot) => [
      snapshot.id,
      snapshot.exists
        ? {
            uid: snapshot.id,
            username: snapshot.get("username") ?? "CodeArena user",
            avatar: snapshot.get("avatar") ?? "",
          }
        : null,
    ]),
  );
}

export function serializeDiscussion(
  snapshot: DocumentSnapshot<DocumentData>,
  author: IDiscussionAuthor | null,
  hasVoted = false,
) {
  const data = snapshot.data() ?? {};
  const asIso = (value: unknown) =>
    value && typeof value === "object" && "toDate" in value &&
    typeof value.toDate === "function"
      ? value.toDate().toISOString()
      : typeof value === "string"
        ? value
        : new Date(0).toISOString();

  return {
    _id: snapshot.id,
    problemId: data.problemId ?? "",
    authorUid: data.authorUid ?? "",
    author,
    title: data.isDeleted ? "Deleted discussion" : data.title ?? "",
    content: data.isDeleted ? "" : data.content ?? "",
    tags: data.isDeleted ? [] : Array.isArray(data.tags) ? data.tags : [],
    votesCount: Number(data.votesCount ?? 0),
    commentsCount: Number(data.commentsCount ?? 0),
    hasVoted,
    isDeleted: Boolean(data.isDeleted),
    createdAt: asIso(data.createdAt),
    updatedAt: asIso(data.updatedAt),
  };
}

export function serializeDiscussionComment(
  snapshot: DocumentSnapshot<DocumentData>,
  author: IDiscussionAuthor | null,
) {
  const data = snapshot.data() ?? {};
  const asIso = (value: unknown) =>
    value && typeof value === "object" && "toDate" in value &&
    typeof value.toDate === "function"
      ? value.toDate().toISOString()
      : typeof value === "string"
        ? value
        : new Date(0).toISOString();

  return {
    _id: snapshot.id,
    discussionId: data.discussionId ?? "",
    authorUid: data.authorUid ?? "",
    author,
    content: data.isDeleted ? "" : data.content ?? "",
    parentCommentId: data.parentCommentId ?? null,
    isDeleted: Boolean(data.isDeleted),
    createdAt: asIso(data.createdAt),
    updatedAt: asIso(data.updatedAt),
  };
}
