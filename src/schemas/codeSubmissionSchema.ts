import { z } from "zod";
import { firestoreDocumentId } from "./similarQuestionSchema";

export const codeSubmissionValidation = z.object({
    userId: z.string().min(1, {message: "User ID is required"}),
    language: z.string().min(1, {message: "Language must be atleast 1 charecters long"}),
    sourceCode: z.string().min(10, {message: "Source code must be atleast 10 charecters long"}),
    problemId: firestoreDocumentId,
})