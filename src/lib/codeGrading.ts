import type { CodeExecutionResult } from "@/types/ApiResponse";

export interface GradingCaseResult {
  run: CodeExecutionResult;
  expected: string;
}

export function normalizeExecutionOutput(output: string): string {
  return output.replace(/\r\n?/gu, "\n").trim();
}

export function outputMatches(actual: string, expected: string): boolean {
  return normalizeExecutionOutput(actual) === normalizeExecutionOutput(expected);
}

export function gradeExecutionResults(results: GradingCaseResult[]) {
  const passedTestCases = results.filter(
    ({ run, expected }) => run.status === "Finished" && outputMatches(run.stdout, expected),
  ).length;
  const failure = results.find(
    ({ run, expected }) => run.status !== "Finished" || !outputMatches(run.stdout, expected),
  );

  return {
    passedTestCases,
    totalTestCases: results.length,
    allPassed: results.length > 0 && passedTestCases === results.length,
    status:
      results.length > 0 && passedTestCases === results.length
        ? "Accepted"
        : failure?.run.status === "Finished"
          ? "Wrong Answer"
          : failure?.run.status ?? "Runtime Error",
  };
}
