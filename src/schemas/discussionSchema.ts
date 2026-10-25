import { z } from "zod";

import { firestoreDocumentId } from "./similarQuestionSchema";

export const discussionContentSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters.").max(120),
  content: z.string().trim().min(10, "Post content must be at least 10 characters.").max(20000),
  tags: z.array(z.string().trim().min(1).max(30)).max(8).default([]),
});

export const discussionCommentSchema = z.object({
  content: z.string().trim().min(2, "Comment must be at least 2 characters.").max(10000),
  parentCommentId: firestoreDocumentId.nullable().optional(),
});

export const discussionCommentEditSchema = z.object({
  content: z.string().trim().min(2, "Comment must be at least 2 characters.").max(10000),
});
