"use client";

import { Flame } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { CodeArenaSession } from "@/context/AuthProvider";
import { ACTIVITY_RECORDED_EVENT } from "@/lib/workspaceEvents";

interface ActivityStreakProps {
  session: CodeArenaSession | null;
}

export default function ActivityStreak({ session }: ActivityStreakProps) {
  const [streak, setStreak] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);

  const loadStreak = useCallback(async (signal?: AbortSignal) => {
    if (!session?.user.uid) {
      setStreak(null);
      setHasError(false);
      return;
    }
    try {
      const response = await fetch("/api/user/streak", {
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error("Streak request failed.");
      const result = (await response.json()) as { currentStreak?: unknown };
      if (typeof result.currentStreak !== "number" || !Number.isFinite(result.currentStreak)) {
        throw new Error("Streak response was invalid.");
      }
      setStreak(result.currentStreak);
      setHasError(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setHasError(true);
      setStreak(null);
    }
  }, [session?.user.uid]);

  useEffect(() => {
    const controller = new AbortController();
    void loadStreak(controller.signal);
    const refresh = () => void loadStreak();
    window.addEventListener(ACTIVITY_RECORDED_EVENT, refresh);
    return () => {
      controller.abort();
      window.removeEventListener(ACTIVITY_RECORDED_EVENT, refresh);
    };
  }, [loadStreak]);

  if (!session) return null;

  return (
    <div
      className="hidden h-9 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm md:flex"
      aria-label={streak === null
        ? hasError ? "Daily activity streak unavailable" : "Loading daily activity streak"
        : `${streak} day daily activity streak`}
      title={hasError
        ? "Activity streak could not be loaded."
        : "A day counts when you save a code submission. Dates are evaluated in UTC."}
    >
      <Flame aria-hidden="true" className="size-4 text-primary" />
      <span className="min-w-4 text-center font-medium">
        {streak === null ? hasError ? "—" : <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-muted" /> : streak}
      </span>
      <span className="hidden text-muted-foreground xl:inline">day streak</span>
    </div>
  );
}
