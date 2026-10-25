"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CalendarClock, Loader2, Plus, Trophy } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import type { IProblem } from "@/models/Problem";

interface Contest {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  startsAt: string;
  endsAt: string;
  problemIds: string[];
  status: string;
  hasAccessCode?: boolean;
}

interface ContestForm {
  title: string;
  description: string;
  instructions: string;
  startsAt: string;
  endsAt: string;
  problemIds: string[];
  accessCode: string;
  removeAccessCode: boolean;
}

const emptyForm: ContestForm = {
  title: "",
  description: "",
  instructions: "",
  startsAt: "",
  endsAt: "",
  problemIds: [],
  accessCode: "",
  removeAccessCode: false,
};

function localDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function contestPayload(form: ContestForm) {
  if (!form.startsAt || !form.endsAt) throw new Error("Choose both contest dates and times.");
  const startsAt = new Date(form.startsAt);
  const endsAt = new Date(form.endsAt);
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
    throw new Error("End time must be after start time.");
  }
  if (startsAt <= new Date()) throw new Error("Start time must be in the future.");
  if (form.problemIds.length === 0) throw new Error("Choose at least one problem.");
  return {
    title: form.title,
    description: form.description,
    instructions: form.instructions,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    problemIds: form.problemIds,
    accessCode: form.accessCode.trim(),
  };
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ContestsPage() {
  const { data: session, status: authStatus } = useSession();
  const isManager = session?.user.userType === "teacher" || session?.user.userType === "admin";
  const [contests, setContests] = useState<Contest[]>([]);
  const [myContests, setMyContests] = useState<Contest[]>([]);
  const [problems, setProblems] = useState<IProblem[]>([]);
  const [form, setForm] = useState<ContestForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [publicResponse, ownResponse] = await Promise.all([
        axios.get<{ contests: Contest[] }>("/api/contests"),
        isManager
          ? axios.get<{ contests: Contest[] }>("/api/contests?scope=mine")
          : Promise.resolve(null),
      ]);
      setContests(publicResponse.data.contests ?? []);
      setMyContests(ownResponse?.data.contests ?? []);
      if (isManager) {
        const response = await axios.get<{ allProblems?: IProblem[] }>("/api/problem/all-problems");
        setProblems(response.data.allProblems ?? []);
      }
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? "Could not load contests."
        : "Could not load contests.";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "local time",
    [],
  );

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = async (contest: Contest) => {
    try {
      const response = await axios.get(`/api/contests/${contest.id}`);
      const details = response.data.contest as Contest;
      setEditingId(contest.id);
      setForm({
        title: details.title,
        description: details.description,
        instructions: details.instructions ?? "",
        startsAt: localDateTime(details.startsAt),
        endsAt: localDateTime(details.endsAt),
        problemIds: details.problemIds,
        accessCode: "",
        removeAccessCode: false,
      });
      setShowForm(true);
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message ?? "Could not load contest." : "Could not load contest.");
    }
  };

  const saveContest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = contestPayload(form);
      if (editingId) {
        const { accessCode, ...contest } = payload;
        await axios.patch(`/api/contests/${editingId}`, {
          action: "edit",
          contest: { ...contest, ...(accessCode ? { accessCode } : {}) },
          removeAccessCode: form.removeAccessCode,
        });
        toast.success("Contest updated.");
      } else {
        const response = await axios.post("/api/contests", payload);
        toast.success(response.data.message ?? "Contest created as a draft.");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await refresh();
    } catch (error) {
      const message = error instanceof Error && !axios.isAxiosError(error)
        ? error.message
        : axios.isAxiosError(error)
          ? error.response?.data?.message ?? "Could not save contest."
          : "Could not save contest.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (contest: Contest, action: "publish" | "unpublish" | "cancel") => {
    if (action === "cancel" && !window.confirm(`Cancel "${contest.title}"? Participants will no longer be able to submit.`)) return;
    try {
      const response = await axios.patch(`/api/contests/${contest.id}`, { action });
      toast.success(response.data.message);
      await refresh();
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message ?? "Contest update failed." : "Contest update failed.");
    }
  };

  const renderContest = (contest: Contest, management: boolean) => (
    <article key={contest.id} className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{contest.title}</h2>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs capitalize text-muted-foreground">
              {contest.status}
            </span>
            {contest.hasAccessCode && <span className="text-xs text-muted-foreground">Access code required</span>}
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{contest.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/contests/${contest.id}`} className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm hover:border-primary hover:text-primary">
            Details
          </Link>
          {management && contest.status !== "cancelled" && new Date(contest.startsAt) > new Date() && (
            <>
              <Button variant="outline" size="sm" onClick={() => void startEdit(contest)}>Edit</Button>
              {contest.status === "draft" ? (
                <Button size="sm" onClick={() => void updateStatus(contest, "publish")}>Publish</Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => void updateStatus(contest, "unpublish")}>Unpublish</Button>
              )}
            </>
          )}
          {management && contest.status !== "cancelled" && new Date(contest.endsAt) > new Date() && (
            <Button variant="destructive" size="sm" onClick={() => void updateStatus(contest, "cancel")}>Cancel contest</Button>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span><CalendarClock className="mr-1 inline size-4" />{dateLabel(contest.startsAt)} – {dateLabel(contest.endsAt)}</span>
        <span>{contest.problemIds.length} problems</span>
      </div>
    </article>
  );

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-6xl space-y-8 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">CodeArena</p>
          <h1 className="mt-1 text-3xl font-bold">Contests</h1>
          <p className="mt-2 text-muted-foreground">Compete in scheduled coding challenges.</p>
        </div>
        {isManager && <Button onClick={startCreate}><Plus className="mr-2 size-4" />Create contest</Button>}
      </header>

      {showForm && (
        <form onSubmit={saveContest} className="space-y-4 rounded-xl border border-primary/40 bg-card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">{editingId ? "Edit contest" : "Create contest"}</h2>
            <span className="text-xs text-muted-foreground">Times are entered in {timezone}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">Title
              <input required minLength={3} maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm">Optional join access code
              <input type="password" autoComplete="new-password" minLength={4} maxLength={64} value={form.accessCode} disabled={form.removeAccessCode} onChange={(e) => setForm({ ...form, accessCode: e.target.value })} placeholder={editingId ? "Leave blank to keep the current code" : "Leave blank for open entry"} className="w-full rounded-md border border-input bg-background px-3 py-2 disabled:opacity-60" />
              {editingId && <span className="mt-1 flex items-center gap-2"><input type="checkbox" checked={form.removeAccessCode} onChange={(e) => setForm({ ...form, removeAccessCode: e.target.checked, accessCode: "" })} />Remove the existing access code</span>}
            </label>
            <label className="space-y-1 text-sm">Start date and time ({timezone})
              <input required type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm">End date and time ({timezone})
              <input required type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">Description
              <textarea required maxLength={5000} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">Instructions
              <textarea maxLength={10000} rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2" />
            </label>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Problems (each accepted problem is worth 100 points)</legend>
            <div className="grid max-h-56 gap-2 overflow-auto rounded-md border border-border p-3 sm:grid-cols-2">
              {problems.map((problem) => {
                const id = String(problem._id ?? "");
                return (
                  <label key={id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.problemIds.includes(id)} onChange={(event) => setForm({
                      ...form,
                      problemIds: event.target.checked
                        ? [...form.problemIds, id]
                        : form.problemIds.filter((problemId) => problemId !== id),
                    })} />
                    <span>{problem.title} <span className="text-muted-foreground">· {problem.level}</span></span>
                  </label>
                );
              })}
              {problems.length === 0 && <p className="text-sm text-muted-foreground">No problems available to select.</p>}
            </div>
          </fieldset>
          <p className="text-xs text-muted-foreground">Schedule displays in {timezone}; data is stored in UTC. New contests are drafts until published. Access codes are stored as salted hashes.</p>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving || problems.length === 0}>{saving && <Loader2 className="mr-2 size-4 animate-spin" />}{editingId ? "Save changes" : "Create draft"}</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Close</Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-muted-foreground"><Loader2 className="size-5 animate-spin" />Loading contests…</div>
      ) : loadError ? (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button variant="outline" className="mt-3" onClick={() => void refresh()}>Retry</Button>
        </div>
      ) : (
        <>
          {isManager && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Your contests</h2>
              {myContests.length
                ? myContests.map((contest) => renderContest(contest, true))
                : <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">No contests yet. Create a draft to get started.</p>}
            </section>
          )}
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-xl font-semibold"><Trophy className="size-5 text-primary" />Available contests</h2>
            {contests.filter((contest) => !myContests.some((owned) => owned.id === contest.id)).length
              ? contests.filter((contest) => !myContests.some((owned) => owned.id === contest.id)).map((contest) => renderContest(contest, false))
              : <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">No published contests are available right now.</p>}
          </section>
        </>
      )}
      {authStatus === "loading" && <p className="text-xs text-muted-foreground">Checking your account…</p>}
    </main>
  );
}
