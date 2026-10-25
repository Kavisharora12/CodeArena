import { z } from "zod";

const firestoreDocumentId = z
  .string()
  .min(1, "Document ID is required")
  .max(1500, "Document ID is too long")
  .regex(/^[^/]+$/, "Invalid document ID");

const dateTime = z.string().datetime({ offset: true });

export const contestInputSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(1).max(5000),
    instructions: z.string().trim().max(10000).default(""),
    startsAt: dateTime,
    endsAt: dateTime,
    problemIds: z.array(firestoreDocumentId).min(1).max(20),
    accessCode: z.string().trim().min(4).max(64).optional().or(z.literal("")),
  })
  .superRefine((value, context) => {
    if (Date.parse(value.endsAt) <= Date.parse(value.startsAt)) {
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End time must be after start time.",
      });
    }
    if (new Set(value.problemIds).size !== value.problemIds.length) {
      context.addIssue({
        code: "custom",
        path: ["problemIds"],
        message: "Choose each problem only once.",
      });
    }
  });

export const contestCreateRequestSchema = contestInputSchema;

export const contestUpdateRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("publish") }),
  z.object({ action: z.literal("unpublish") }),
  z.object({ action: z.literal("cancel") }),
  z.object({
    action: z.literal("edit"),
    contest: contestInputSchema,
    removeAccessCode: z.boolean().optional(),
  }),
]);

export const contestJoinRequestSchema = z.object({
  accessCode: z.string().max(64).optional(),
});

export function findMissingContestProblemIndex(
  problemIds: string[],
  existingProblemIds: string[],
): number {
  const existing = new Set(existingProblemIds);
  return problemIds.findIndex((problemId) => !existing.has(problemId));
}

export function isContestWindowOpen(
  contest: { status?: unknown; startsAt?: unknown; endsAt?: unknown },
  now = Date.now(),
): boolean {
  if (
    typeof contest.status !== "string" ||
    typeof contest.startsAt !== "string" ||
    typeof contest.endsAt !== "string"
  ) {
    return false;
  }
  const startsAt = Date.parse(contest.startsAt);
  const endsAt = Date.parse(contest.endsAt);
  return (
    contest.status === "published" &&
    Number.isFinite(startsAt) &&
    Number.isFinite(endsAt) &&
    now >= startsAt &&
    now < endsAt
  );
}

export interface ContestStanding {
  uid: string;
  username: string;
  score: number;
  solvedCount: number;
  joinedAt: string;
  scoreAchievedAt: string | null;
}

export function rankContestStandings(standings: ContestStanding[]) {
  return [...standings]
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (left.scoreAchievedAt !== right.scoreAchievedAt) {
        if (!left.scoreAchievedAt) return 1;
        if (!right.scoreAchievedAt) return -1;
        return left.scoreAchievedAt.localeCompare(right.scoreAchievedAt);
      }
      return left.joinedAt.localeCompare(right.joinedAt);
    })
    .map((standing, index) => ({ rank: index + 1, ...standing }));
}
