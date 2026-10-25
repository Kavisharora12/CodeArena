const WINDOW_MS = 5 * 60_000;
const MAX_ATTEMPTS = 10;

export function nextContestJoinAttempts(
  previousAttempts: unknown,
  now = Date.now(),
): number[] | null {
  const recentAttempts = Array.isArray(previousAttempts)
    ? previousAttempts.filter(
        (timestamp): timestamp is number =>
          typeof timestamp === "number" &&
          Number.isFinite(timestamp) &&
          now - timestamp < WINDOW_MS,
      )
    : [];
  if (recentAttempts.length >= MAX_ATTEMPTS) return null;
  return [...recentAttempts, now];
}
