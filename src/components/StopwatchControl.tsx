"use client";

import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { useEffect, useReducer, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  elapsedStopwatchMs,
  formatStopwatchTime,
  initialStopwatchState,
  stopwatchReducer,
} from "@/lib/stopwatch";

export default function StopwatchControl() {
  const [state, dispatch] = useReducer(stopwatchReducer, initialStopwatchState);
  const [open, setOpen] = useState(false);
  const running = state.startedAt !== null;

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      dispatch({ type: "tick", now: Date.now() });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  const elapsed = elapsedStopwatchMs(state);
  const hasElapsed = state.elapsedMs > 0 || state.startedAt !== null;

  return (
    <div className="flex min-w-0 items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Stopwatch ${running ? "running" : "paused"}, ${formatStopwatchTime(elapsed)}`}
        aria-expanded={open}
        aria-controls="codearena-stopwatch"
        title="Problem-solving stopwatch"
        onClick={() => setOpen((value) => !value)}
        className="size-9"
      >
        <Timer aria-hidden="true" className={running ? "size-5 text-primary" : "size-5"} />
      </Button>
      {open && (
        <section
          id="codearena-stopwatch"
          aria-label="Stopwatch controls"
          className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-popover px-2 py-1 text-popover-foreground shadow-sm"
        >
          <div className="min-w-0">
            <h2 className="text-[10px] font-medium leading-tight text-muted-foreground">Stopwatch</h2>
            <output aria-live="off" className="block whitespace-nowrap font-mono text-sm font-semibold tabular-nums tracking-wide">
              {formatStopwatchTime(elapsed)}
            </output>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Button
              type="button"
              size="sm"
              onClick={() => dispatch({ type: running ? "pause" : "start", now: Date.now() })}
              className="h-7 px-2 text-xs"
            >
              {running ? <Pause aria-hidden="true" className="size-3" /> : <Play aria-hidden="true" className="size-3" />}
              {running ? "Pause" : hasElapsed ? "Resume" : "Start"}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Reset stopwatch"
              title="Reset stopwatch"
              className="size-7"
              onClick={() => dispatch({ type: "reset", now: Date.now() })}
            >
              <RotateCcw aria-hidden="true" className="size-3" />
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
