"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ListVideo, Loader2, Play, Shuffle, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

import type { CodeArenaSession } from "@/context/AuthProvider";
import { dispatchWorkspaceAction, WORKSPACE_BUSY_EVENT } from "@/lib/workspaceEvents";
import { Button } from "./ui/button";

interface NavRunButtonType {
  session: CodeArenaSession | null;
}

interface ProblemListResult {
  allProblems?: Array<{ _id?: string; id?: string }>;
}

export default function NavRunButtonsContainer({ session }: NavRunButtonType) {
  const router = useRouter();
  const pathname = usePathname();
  const [isBusy, setIsBusy] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  useEffect(() => {
    const updateBusy = (event: Event) => {
      setIsBusy(Boolean((event as CustomEvent<boolean>).detail));
    };
    window.addEventListener(WORKSPACE_BUSY_EVENT, updateBusy);
    return () => window.removeEventListener(WORKSPACE_BUSY_EVENT, updateBusy);
  }, []);

  const handleShuffle = async () => {
    setIsShuffling(true);
    try {
      const response = await fetch("/api/problem/all-problems", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load the problem list.");
      const result = (await response.json()) as ProblemListResult;
      const available = (result.allProblems ?? [])
        .map((problem) => problem._id ?? problem.id)
        .filter((id): id is string => Boolean(id) && `/problem/${id}` !== pathname);
      if (available.length === 0) {
        toast.error("No other problems are available to shuffle to.");
        return;
      }
      router.push(`/problem/${available[Math.floor(Math.random() * available.length)]}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to choose a random problem.");
    } finally {
      setIsShuffling(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-center gap-1 sm:gap-2">
      <div className="flex shrink-0 items-center gap-1">
        <Button asChild type="button" variant="ghost" size="sm" className="h-9 px-2 sm:px-3">
          <Link href="/problems" aria-label="Problem List">
            <ListVideo aria-hidden="true" className="size-4" />
            <span className="hidden xl:inline">Problem List</span>
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={isShuffling ? "Choosing a random problem" : "Go to a random problem"}
          title="Go to a random problem"
          disabled={isShuffling}
          onClick={() => void handleShuffle()}
          className="size-9"
        >
          {isShuffling
            ? <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            : <Shuffle aria-hidden="true" className="size-4" />}
        </Button>
      </div>
      <span aria-hidden="true" className="mx-1 hidden h-6 border-l sm:block" />
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-9 px-2 sm:px-3"
          disabled={!session || isBusy}
          title="Run JavaScript with the custom input"
          onClick={() => dispatchWorkspaceAction("run")}
        >
          <Play aria-hidden="true" className="size-4" />
          <span className="hidden xl:inline">Run</span>
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-9 px-2 sm:px-3"
          disabled={!session || isBusy}
          onClick={() => dispatchWorkspaceAction("submit")}
        >
          <Upload aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">{isBusy ? "Working" : "Submit"}</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9"
          aria-label="Open CodeArena AI"
          title="Open CodeArena AI"
          disabled={!session}
          onClick={() => dispatchWorkspaceAction("assistant")}
        >
          <Sparkles aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  );
}
