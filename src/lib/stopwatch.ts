export interface StopwatchState {
  elapsedMs: number;
  startedAt: number | null;
  now: number;
}

export type StopwatchAction =
  | { type: "start"; now: number }
  | { type: "pause"; now: number }
  | { type: "reset"; now: number }
  | { type: "tick"; now: number };

export const initialStopwatchState: StopwatchState = {
  elapsedMs: 0,
  startedAt: null,
  now: 0,
};

export function stopwatchReducer(
  state: StopwatchState,
  action: StopwatchAction,
): StopwatchState {
  if (action.type === "reset") {
    return { elapsedMs: 0, startedAt: null, now: action.now };
  }
  if (action.type === "start") {
    return state.startedAt === null
      ? { ...state, startedAt: action.now, now: action.now }
      : state;
  }
  if (action.type === "pause") {
    if (state.startedAt === null) return state;
    return {
      elapsedMs: state.elapsedMs + Math.max(0, action.now - state.startedAt),
      startedAt: null,
      now: action.now,
    };
  }
  return { ...state, now: action.now };
}

export function elapsedStopwatchMs(state: StopwatchState, now = state.now): number {
  return state.elapsedMs + (state.startedAt === null ? 0 : Math.max(0, now - state.startedAt));
}

export function formatStopwatchTime(milliseconds: number): string {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export function formatStopwatchTimeCompact(milliseconds: number): string {
  const totalMinutes = Math.floor(Math.max(0, milliseconds) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
