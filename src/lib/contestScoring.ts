export function contestProblemAward(
  solvedProblemIds: unknown,
  problemId: string,
  configuredPoints: unknown,
): { problemId: string; points: number } | null {
  const solved = Array.isArray(solvedProblemIds) ? solvedProblemIds : [];
  if (solved.includes(problemId)) return null;
  const points =
    typeof configuredPoints === "number" &&
    Number.isFinite(configuredPoints) &&
    configuredPoints > 0
      ? configuredPoints
      : 100;
  return { problemId, points };
}
