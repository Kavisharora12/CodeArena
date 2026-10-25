"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useSession } from "@/context/AuthProvider";

interface ContestDetails {
  id: string;
  title: string;
  description: string;
  instructions: string;
  startsAt: string;
  endsAt: string;
  status: string;
  hasAccessCode: boolean;
  isManager: boolean;
  joined: boolean;
  problems: { id: string; title: string; difficulty: string }[];
}

interface Standing {
  rank: number;
  username: string;
  score: number;
  solvedCount: number;
  scoreAchievedAt: string | null;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "short" }).format(new Date(value));
}

export default function ContestDetailsPage() {
  const params = useParams<{ contestId: string }>();
  const contestId = params.contestId;
  const { data: session } = useSession();
  const [contest, setContest] = useState<ContestDetails | null>(null);
  const [leaderboard, setLeaderboard] = useState<Standing[]>([]);
  const [accessCode, setAccessCode] = useState("");
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [joining, setJoining] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoadError("");
      const [details, ranks] = await Promise.all([
        axios.get(`/api/contests/${contestId}`),
        axios.get(`/api/contests/${contestId}/leaderboard`),
      ]);
      setContest(details.data.contest);
      setLeaderboard(ranks.data.leaderboard ?? []);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? "Could not load contest."
        : "Could not load contest.";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const joinContest = async () => {
    setJoining(true);
    try {
      const response = await axios.post(`/api/contests/${contestId}/join`, { accessCode });
      toast.success(response.data.message);
      await refresh();
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message ?? "Could not join contest." : "Could not join contest.");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <main className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center gap-2 text-muted-foreground"><Loader2 className="size-5 animate-spin" />Loading contest…</main>;
  }
  if (!contest) {
    return <main className="mx-auto max-w-5xl px-4 py-12"><p role="alert" className="text-muted-foreground">{loadError || "Contest not found or is not available."}</p>{loadError && <Button variant="outline" className="mt-3" onClick={() => { setLoading(true); void refresh(); }}>Retry</Button>}<Link href="/contests" className="mt-4 inline-flex items-center gap-2 text-primary"><ArrowLeft className="size-4" />All contests</Link></main>;
  }

  const starts = Date.parse(contest.startsAt);
  const ends = Date.parse(contest.endsAt);
  const status = contest.status === "cancelled"
    ? "Cancelled"
    : now < starts
      ? "Upcoming"
      : now < ends
        ? "Live"
        : "Ended";
  const canSubmit = contest.joined && status === "Live";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "local time";

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-5xl space-y-6 px-4 py-8">
      <Link href="/contests" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" />All contests</Link>
      <header className="rounded-xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">CodeArena Contest</p>
            <h1 className="mt-2 text-3xl font-bold">{contest.title}</h1>
            <p className="mt-3 max-w-3xl whitespace-pre-wrap text-muted-foreground">{contest.description}</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-sm ${status === "Live" ? "border-green-500/50 text-green-500" : "border-border text-muted-foreground"}`}>{status}</span>
        </div>
        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">Starts ({timezone}):</span> {dateLabel(contest.startsAt)}</p>
          <p><span className="text-muted-foreground">Ends ({timezone}):</span> {dateLabel(contest.endsAt)}</p>
          <p><span className="text-muted-foreground">Scoring:</span> 100 points per uniquely accepted problem</p>
          <p><span className="text-muted-foreground">Participants:</span> {leaderboard.length}</p>
        </div>
        {contest.instructions && <div className="mt-5 border-t border-border pt-4"><h2 className="font-semibold">Instructions</h2><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{contest.instructions}</p></div>}

        {!contest.joined && !contest.isManager && status !== "Ended" && status !== "Cancelled" && (
          <div className="mt-6 flex flex-wrap items-end gap-3 border-t border-border pt-5">
            {contest.hasAccessCode && <label className="min-w-56 flex-1 space-y-1 text-sm">Access code<input type="password" autoComplete="off" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2" /></label>}
            {session ? (
              <Button onClick={() => void joinContest()} disabled={joining}>
                {joining && <Loader2 className="mr-2 size-4 animate-spin" />}Join contest
              </Button>
            ) : (
              <Button asChild><Link href="/sign-in">Sign in to join</Link></Button>
            )}
          </div>
        )}
      </header>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-xl font-semibold">Problems</h2>
        <div className="mt-3 space-y-2">
          {contest.problems.map((problem, index) => (
            <div key={problem.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div><span className="mr-2 text-sm text-muted-foreground">{index + 1}.</span><span className="font-medium">{problem.title}</span><span className="ml-2 text-sm text-muted-foreground">{problem.difficulty}</span></div>
              {canSubmit && <Link href={`/problem/${problem.id}?contestId=${contest.id}`} className="text-sm font-medium text-primary hover:underline">Open problem</Link>}
            </div>
          ))}
        </div>
        {!contest.joined && <p className="mt-3 text-sm text-muted-foreground">Join this contest to open its problems during the contest window.</p>}
        {contest.joined && status !== "Live" && <p className="mt-3 text-sm text-muted-foreground">Problem submissions are enabled only during the scheduled contest window.</p>}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Trophy className="size-5 text-primary" />Leaderboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">Ranked by score, then earliest time at that score, then join time.</p>
        {leaderboard.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground"><tr><th className="p-2">Rank</th><th className="p-2">Participant</th><th className="p-2">Solved</th><th className="p-2">Score</th></tr></thead>
              <tbody>{leaderboard.map((standing) => <tr key={`${standing.rank}-${standing.username}`} className="border-b border-border/60"><td className="p-2">{standing.rank}</td><td className="p-2">{standing.username}</td><td className="p-2">{standing.solvedCount}</td><td className="p-2 font-semibold text-primary">{standing.score}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="mt-4 text-sm text-muted-foreground">No participants have joined yet.</p>}
      </section>
    </main>
  );
}
