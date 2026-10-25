import { z } from "zod";
import { firestoreDocumentId } from "./similarQuestionSchema.ts";

export const solutionValidation = z.object({
  problemId: firestoreDocumentId,
  title: z.string().trim().min(4, { message: "Title must be at least 4 characters long." }).max(120),
  language: z.string().trim().min(1).max(40).default("JavaScript"),
  tags: z.array(z.string().trim().max(40)).max(10).default([]).transform((tags) => tags.filter(Boolean)),
  explanation: z.string().max(20_000).optional().default(""),
  sourceCode: z.string().min(10, { message: "The source code must be at least 10 characters long." }).max(100_000),
  isOfficial: z.boolean().optional().default(false),
});

export const solutionUpdateValidation = solutionValidation
  .omit({ problemId: true })
  .extend({ isOfficial: z.boolean().optional() });