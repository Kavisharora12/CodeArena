import { z } from "zod";

export const chatOutputValidation = z
  .object({
    inputMessage: z
      .string()
      .trim()
      .min(1, { message: "Enter a message before sending." })
      .max(4000, { message: "Messages must be 4,000 characters or fewer." }),
    sourceCode: z
      .string()
      .max(64 * 1024, { message: "Attached source code exceeds the 64 KB limit." })
      .optional(),
  })
  .strict();