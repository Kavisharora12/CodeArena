import assert from "node:assert/strict";
import { test } from "node:test";

import { solutionValidation } from "./solutiionSchema.ts";
import { canManageSolution, canPublishOfficialSolution } from "../lib/solutionAuthorization.ts";

const validSolution = {
  problemId: "problem-123",
  title: "Hash map approach",
  language: "JavaScript",
  sourceCode: "function solve(input) { return input; }",
};

test("accepts a community solution with optional explanation and default metadata", () => {
  const parsed = solutionValidation.safeParse(validSolution);
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.explanation, "");
  assert.deepEqual(parsed.data.tags, []);
  assert.equal(parsed.data.isOfficial, false);
});

test("rejects invalid problem IDs, short code, and oversized fields", () => {
  assert.equal(solutionValidation.safeParse({ ...validSolution, problemId: "bad/id" }).success, false);
  assert.equal(solutionValidation.safeParse({ ...validSolution, sourceCode: "x" }).success, false);
  assert.equal(solutionValidation.safeParse({ ...validSolution, title: "x".repeat(121) }).success, false);
});

test("accepts official publication as an explicit role-gated API field", () => {
  assert.equal(solutionValidation.safeParse({ ...validSolution, isOfficial: true }).success, true);
});

test("allows community owners to manage their own solutions and admins only official solutions", () => {
  assert.equal(canManageSolution("author", "user", "author", false), true);
  assert.equal(canManageSolution("student", "user", "author", false), false);
  assert.equal(canManageSolution("admin", "admin", "author", true), true);
  assert.equal(canManageSolution("student", "user", "author", true), false);
  assert.equal(canPublishOfficialSolution("admin", true), true);
  assert.equal(canPublishOfficialSolution("user", true), false);
});
