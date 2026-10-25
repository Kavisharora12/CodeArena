import assert from "node:assert/strict";
import { test } from "node:test";

import {
  contestInputSchema,
  findMissingContestProblemIndex,
  isContestWindowOpen,
  rankContestStandings,
} from "../schemas/contestSchema.ts";
import {
  hashContestAccessCode,
  verifyContestAccessCode,
} from "./contestAccessCode.ts";
import { canManageContestByRole } from "./contestAuthorization.ts";
import { nextContestJoinAttempts } from "./contestJoinRateLimit.ts";
import { contestPublicFields } from "./contestPublicData.ts";
import { contestProblemAward } from "./contestScoring.ts";

const validContest = {
  title: "Autumn Challenge",
  description: "Solve the selected problems.",
  instructions: "",
  startsAt: "2030-10-01T10:00:00.000Z",
  endsAt: "2030-10-01T12:00:00.000Z",
  problemIds: ["problem-one"],
};

test("validates contest schedule and selected problem IDs", () => {
  assert.equal(contestInputSchema.safeParse(validContest).success, true);
  assert.equal(
    contestInputSchema.safeParse({
      ...validContest,
      endsAt: validContest.startsAt,
    }).success,
    false,
  );
  assert.equal(
    contestInputSchema.safeParse({
      ...validContest,
      problemIds: ["problem-one", "problem-one"],
    }).success,
    false,
  );
  assert.equal(
    contestInputSchema.safeParse({
      ...validContest,
      startsAt: "not-a-date",
    }).success,
    false,
  );
  assert.equal(findMissingContestProblemIndex(["first", "missing"], ["first"]), 1);
});

test("only permits contest submissions within the published time window", () => {
  const contest = {
    status: "published",
    startsAt: validContest.startsAt,
    endsAt: validContest.endsAt,
  };
  assert.equal(isContestWindowOpen(contest, Date.parse("2030-10-01T10:00:00Z")), true);
  assert.equal(isContestWindowOpen(contest, Date.parse("2030-10-01T12:00:00Z")), false);
  assert.equal(isContestWindowOpen({ ...contest, status: "draft" }, Date.parse("2030-10-01T11:00:00Z")), false);
});

test("ranks by score, earliest score time, then earliest join time", () => {
  const ranked = rankContestStandings([
    { uid: "late", username: "Late", score: 100, solvedCount: 1, joinedAt: "2029-01-01", scoreAchievedAt: "2030-10-01T10:10:00Z" },
    { uid: "early", username: "Early", score: 100, solvedCount: 1, joinedAt: "2029-01-02", scoreAchievedAt: "2030-10-01T10:05:00Z" },
    { uid: "first", username: "First", score: 100, solvedCount: 1, joinedAt: "2029-01-01", scoreAchievedAt: "2030-10-01T10:05:00Z" },
    { uid: "zero", username: "Zero", score: 0, solvedCount: 0, joinedAt: "2029-01-01", scoreAchievedAt: null },
  ]);
  assert.deepEqual(ranked.map(({ uid, rank }) => [uid, rank]), [
    ["first", 1],
    ["early", 2],
    ["late", 3],
    ["zero", 4],
  ]);
});

test("awards contest points only once per accepted problem", () => {
  assert.deepEqual(contestProblemAward([], "problem-one", 100), {
    problemId: "problem-one",
    points: 100,
  });
  assert.equal(contestProblemAward(["problem-one"], "problem-one", 100), null);
  assert.deepEqual(contestProblemAward([], "problem-one", Number.NaN), {
    problemId: "problem-one",
    points: 100,
  });
});

test("stores access codes as salted hashes and checks them safely", () => {
  const credentials = hashContestAccessCode("valid-code");
  assert.notEqual(credentials.hash, "valid-code");
  assert.notEqual(credentials.salt, "valid-code");
  assert.equal(verifyContestAccessCode("valid-code", credentials.salt, credentials.hash), true);
  assert.equal(verifyContestAccessCode("wrong-code", credentials.salt, credentials.hash), false);
});

test("only admins or the owning teacher can manage a contest", () => {
  assert.equal(canManageContestByRole("owner", "teacher", "owner"), true);
  assert.equal(canManageContestByRole("other", "teacher", "owner"), false);
  assert.equal(canManageContestByRole("student", "user", "owner"), false);
  assert.equal(canManageContestByRole("admin", "admin", "owner"), true);
});

test("limits repeated join and access-code attempts from stored timestamps", () => {
  const now = Date.now();
  const timestamps = Array.from({ length: 10 }, (_, index) => now - index);
  assert.equal(nextContestJoinAttempts(timestamps, now), null);
  assert.deepEqual(nextContestJoinAttempts([now - 6 * 60_000], now), [now]);
});

test("contest API presentation data excludes access-code hashes and test cases", () => {
  const result = contestPublicFields({
    title: "Contest",
    startsAt: validContest.startsAt,
    endsAt: validContest.endsAt,
    problemIds: ["problem-one"],
    accessCodeHash: "secret-hash",
    accessCodeSalt: "secret-salt",
    testCases: [{ input: "private", output: "answer" }],
  });
  assert.equal("accessCodeHash" in result, false);
  assert.equal("accessCodeSalt" in result, false);
  assert.equal("testCases" in result, false);
  assert.equal(result.hasAccessCode, true);
});
