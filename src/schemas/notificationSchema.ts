import { z } from "zod";

export const notificationCreateSchema = z.object({
  title: z.string().trim().min(3, "Notification title must be at least 3 characters.").max(120),
  message: z.string().trim().min(3, "Notification message must be at least 3 characters.").max(2_000),
});
