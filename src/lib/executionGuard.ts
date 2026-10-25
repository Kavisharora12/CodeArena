const RATE_WINDOW_MS = 60_000;
const MAX_CONCURRENT_EXECUTIONS = 2;

type GuardState = {
  active: number;
  requestsByUser: Map<string, number[]>;
};

const globalState = globalThis as typeof globalThis & {
  codeArenaExecutionGuard?: GuardState;
};

const state: GuardState =
  globalState.codeArenaExecutionGuard ??
  (globalState.codeArenaExecutionGuard = {
    active: 0,
    requestsByUser: new Map(),
  });

export function consumeExecutionRateLimit(uid: string, limit: number): boolean {
  const now = Date.now();
  if (!state.requestsByUser.has(uid) && state.requestsByUser.size >= 10_000) {
    for (const [userId, timestamps] of state.requestsByUser) {
      if (timestamps.every((timestamp) => now - timestamp >= RATE_WINDOW_MS)) {
        state.requestsByUser.delete(userId);
      }
    }
    if (state.requestsByUser.size >= 10_000) return false;
  }
  const recentRequests = (state.requestsByUser.get(uid) ?? []).filter(
    (timestamp) => now - timestamp < RATE_WINDOW_MS,
  );
  if (recentRequests.length >= limit) {
    state.requestsByUser.set(uid, recentRequests);
    return false;
  }
  recentRequests.push(now);
  state.requestsByUser.set(uid, recentRequests);
  return true;
}

export function acquireExecutionSlot(): (() => void) | null {
  if (state.active >= MAX_CONCURRENT_EXECUTIONS) return null;
  state.active += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    state.active -= 1;
  };
}
