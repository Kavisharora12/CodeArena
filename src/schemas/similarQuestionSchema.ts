import { z } from "zod";

export const firestoreDocumentId = z
    .string()
    .min(1, "Document ID is required")
    .max(1500, "Document ID is too long")
    .regex(/^[^/]+$/, "Invalid document ID");

export const similarQuestionValidation = z.object({
    _id: firestoreDocumentId,
    title: z.string().min(6, {message: "Titel mustbe atleast 6 charecters"}),
    level: z.string().max(6, {message: "Level consist maximum 6 charecters"})
})