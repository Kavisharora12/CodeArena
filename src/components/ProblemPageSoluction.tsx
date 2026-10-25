"use client";

import axios from "axios";
import MDEditor from "@uiw/react-md-editor";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useSession } from "@/context/AuthProvider";
import type { ISolution } from "@/models/Solution";
import type { ApiResponse, codeSubmissionResultType } from "@/types/ApiResponse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SolutionForm {
  title: string;
  language: string;
  sourceCode: string;
  explanation: string;
  isOfficial: boolean;
}

const EMPTY_FORM: SolutionForm = {
  title: "",
  language: "JavaScript",
  sourceCode: "",
  explanation: "",
  isOfficial: false,
};
const LANGUAGES = ["JavaScript", "TypeScript", "Python", "Java", "C++"];

function solutionOwner(solution: ISolution): string | undefined {
  return typeof solution.userId === "string" ? solution.userId : solution.userId?._id;
}

function solutionCode(solution: ISolution): string {
  return solution.code ?? solution.sourceCode ?? "";
}

export default function ProblemPageSoluction({
  problemId,
  currentCode,
}: {
  problemId: string;
  currentCode: string;
}) {
  const { data: session, status: sessionStatus } = useSession();
  const [solutions, setSolutions] = useState<ISolution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState<ISolution | null>(null);
  const [form, setForm] = useState<SolutionForm>(EMPTY_FORM);
  const [acceptedSubmissions, setAcceptedSubmissions] = useState<codeSubmissionResultType[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingSolutionId, setDeletingSolutionId] = useState("");

  const loadSolutions = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const response = await axios.get<ApiResponse>(
        `/api/solution/get-solutions?problemId=${encodeURIComponent(problemId)}`,
      );
      setSolutions((response.data.solutions as ISolution[] | undefined) ?? []);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? "Unable to load community solutions."
        : "Unable to load community solutions.";
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    void loadSolutions();
  }, [loadSolutions]);

  const filteredSolutions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return solutions;
    return solutions.filter((solution) =>
      solution.title.toLowerCase().includes(query)
      || (solution.language ?? "").toLowerCase().includes(query)
      || (typeof solution.userId !== "string" && solution.userId?.username?.toLowerCase().includes(query)),
    );
  }, [search, solutions]);

  const openComposer = async (solution?: ISolution) => {
    if (!session?.user) {
      toast.error("Sign in to share a solution.");
      return;
    }
    const editing = solution ?? null;
    setEditingSolution(editing);
    setIsComposerOpen(true);
    setAcceptedSubmissions([]);
    setSelectedSubmissionId("");
    setIsLoadingSubmissions(!editing);
    setForm(editing
      ? {
          title: editing.title,
          language: editing.language ?? "JavaScript",
          sourceCode: solutionCode(editing),
          explanation: editing.explanation ?? "",
          isOfficial: editing.isOfficial === true,
        }
      : { ...EMPTY_FORM, sourceCode: currentCode });

    if (editing) return;
    try {
      const response = await axios.get<ApiResponse>(
        `/api/problem/get-submitted-code?problemId=${encodeURIComponent(problemId)}`,
      );
      const accepted = ((response.data.submissions as codeSubmissionResultType[] | undefined) ?? [])
        .filter((submission) => submission.status === "Accepted" && Boolean(submission.sourceCode));
      setAcceptedSubmissions(accepted);
      if (accepted.length > 0) {
        const preferred = accepted[0];
        setSelectedSubmissionId(preferred._id ?? "");
        setForm((current) => ({
          ...current,
          sourceCode: preferred.sourceCode,
          language: preferred.language || "JavaScript",
        }));
      }
    } catch {
      toast.error("Could not load your accepted submissions. You can still paste your solution.");
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const closeComposer = () => {
    if (isSaving) return;
    setIsComposerOpen(false);
    setEditingSolution(null);
  };

  const handleSubmissionSelection = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    const submission = acceptedSubmissions.find((item) => item._id === submissionId);
    if (submission) {
      setForm((current) => ({
        ...current,
        sourceCode: submission.sourceCode,
        language: submission.language || "JavaScript",
      }));
    } else if (submissionId === "__editor__") {
      setForm((current) => ({ ...current, sourceCode: currentCode }));
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.user) {
      toast.error("Sign in to share a solution.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...(editingSolution ? {} : { problemId }),
        title: form.title,
        language: form.language,
        sourceCode: form.sourceCode,
        explanation: form.explanation,
        ...(session.user.userType === "admin" ? { isOfficial: form.isOfficial } : {}),
      };
      if (editingSolution?._id) {
        await axios.put(`/api/solution/${encodeURIComponent(editingSolution._id)}`, payload);
        toast.success("Solution updated.");
      } else {
        await axios.post("/api/solution/add-solution", payload);
        toast.success("Solution shared with the community.");
      }
      setIsComposerOpen(false);
      setEditingSolution(null);
      await loadSolutions();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? "Unable to save your solution."
        : "Unable to save your solution.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (solution: ISolution) => {
    if (!solution._id || !window.confirm(`Delete "${solution.title}"? This cannot be undone.`)) return;
    setDeletingSolutionId(solution._id);
    try {
      await axios.delete(`/api/solution/${encodeURIComponent(solution._id)}`);
      setSolutions((current) => current.filter((item) => item._id !== solution._id));
      toast.success("Solution deleted.");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? "Unable to delete this solution."
        : "Unable to delete this solution.";
      toast.error(message);
    } finally {
      setDeletingSolutionId("");
    }
  };

  return (
    <section className="relative min-h-[calc(100vh-6.5rem)] bg-[var(--card)] px-4 pb-12 pt-4 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Community solutions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Learn from approaches shared by other CodeArena members.
          </p>
        </div>
        <Button onClick={() => void openComposer()} disabled={sessionStatus === "loading"} className="bg-primary text-primary-foreground">
          <Plus aria-hidden="true" className="size-4" />
          Share Solution
        </Button>
      </div>

      {solutions.length > 0 && (
        <label className="mb-4 flex items-center gap-2 rounded-md border px-3">
          <Search aria-hidden="true" className="size-4 text-muted-foreground" />
          <Input
            aria-label="Search solutions"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, author, or language"
            className="border-0 focus-visible:ring-0"
          />
        </label>
      )}

      {isLoading && (
        <div role="status" className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
          <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          Loading solutions…
        </div>
      )}
      {!isLoading && loadError && (
        <div role="alert" className="rounded-md border border-destructive/40 p-5 text-sm">
          <p>{loadError}</p>
          <Button variant="outline" className="mt-3" onClick={() => void loadSolutions()}>Try again</Button>
        </div>
      )}
      {!isLoading && !loadError && solutions.length === 0 && (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center">
          <h3 className="text-lg font-semibold">No solutions shared yet</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Share your approach to help the community learn. Your solution can be based on an accepted submission or written from scratch.
          </p>
          <Button onClick={() => void openComposer()} disabled={sessionStatus === "loading"} className="bg-primary text-primary-foreground">
            <Plus aria-hidden="true" className="size-4" />
            Share Solution
          </Button>
        </div>
      )}
      {!isLoading && !loadError && solutions.length > 0 && filteredSolutions.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">No solutions match that search.</p>
      )}

      <div className="space-y-4">
        {!isLoading && !loadError && filteredSolutions.map((solution) => {
          const ownerId = solutionOwner(solution);
          const author = typeof solution.userId === "string" ? "CodeArena member" : solution.userId?.username || "CodeArena member";
          const canManage = Boolean(session?.user && (
            ownerId === session.user.uid
            || (session.user.userType === "admin" && solution.isOfficial === true)
          ));
          const code = solutionCode(solution);
          return (
            <article key={solution._id ?? `${solution.title}-${solution.createdAt}`} className="rounded-lg border bg-background p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="break-words text-lg font-semibold">{solution.title}</h3>
                    {solution.isOfficial && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">Official</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {author} <span aria-hidden="true">·</span> {solution.language ?? "JavaScript"}
                  </p>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => void openComposer(solution)}>
                      <Pencil aria-hidden="true" className="size-4" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deletingSolutionId === solution._id}
                      onClick={() => void handleDelete(solution)}
                      aria-label={`Delete ${solution.title}`}
                    >
                      {deletingSolutionId === solution._id
                        ? <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                        : <Trash2 aria-hidden="true" className="size-4" />}
                      Delete
                    </Button>
                  </div>
                )}
              </div>
              {solution.explanation && (
                <div className="mt-4 overflow-hidden rounded-md text-sm">
                  <MDEditor.Markdown source={solution.explanation} className="markdown-body customTransparent customTextWhite" />
                </div>
              )}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-primary">View code</summary>
                <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-black/40 p-4 text-xs leading-5">
                  <code>{code}</code>
                </pre>
              </details>
            </article>
          );
        })}
      </div>

      {isComposerOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeComposer();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="solution-dialog-title"
            className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-xl border bg-background p-5 shadow-xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 id="solution-dialog-title" className="text-xl font-semibold">
                  {editingSolution ? "Edit solution" : "Share a solution"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">Your solution will be visible to the community.</p>
              </div>
              <Button type="button" variant="ghost" onClick={closeComposer} disabled={isSaving}>Cancel</Button>
            </div>
            <form onSubmit={(event) => void handleSave(event)} className="space-y-4">
              {!editingSolution && (
                <div>
                  <label htmlFor="solution-submission" className="mb-1 block text-sm font-medium">Start from an accepted submission (optional)</label>
                  <select
                    id="solution-submission"
                    value={selectedSubmissionId}
                    onChange={(event) => handleSubmissionSelection(event.target.value)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">Use editor contents / write code</option>
                    {acceptedSubmissions.map((submission) => (
                      <option key={submission._id} value={submission._id}>
                        Accepted · {submission.language} · {submission.createdAt ? new Date(submission.createdAt).toLocaleString() : submission._id}
                      </option>
                    ))}
                  </select>
                  {isLoadingSubmissions && <p role="status" className="mt-1 text-xs text-muted-foreground">Checking your accepted submissions…</p>}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
                <div>
                  <label htmlFor="solution-title" className="mb-1 block text-sm font-medium">Title</label>
                  <Input id="solution-title" required minLength={4} maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
                </div>
                <div>
                  <label htmlFor="solution-language" className="mb-1 block text-sm font-medium">Language</label>
                  <select id="solution-language" value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    {LANGUAGES.map((language) => <option key={language} value={language}>{language}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="solution-code" className="mb-1 block text-sm font-medium">Code</label>
                <textarea
                  id="solution-code"
                  required
                  minLength={10}
                  maxLength={100_000}
                  rows={12}
                  value={form.sourceCode}
                  onChange={(event) => setForm({ ...form, sourceCode: event.target.value })}
                  className="w-full resize-y rounded-md border bg-black/30 p-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="solution-explanation" className="mb-1 block text-sm font-medium">Explanation / approach <span className="font-normal text-muted-foreground">(optional, Markdown supported)</span></label>
                <textarea
                  id="solution-explanation"
                  maxLength={20_000}
                  rows={5}
                  value={form.explanation}
                  onChange={(event) => setForm({ ...form, explanation: event.target.value })}
                  className="w-full resize-y rounded-md border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Describe the key idea, complexity, or trade-offs."
                />
              </div>
              {session?.user.userType === "admin" && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isOfficial} onChange={(event) => setForm({ ...form, isOfficial: event.target.checked })} />
                  Publish as an official solution
                </label>
              )}
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={closeComposer} disabled={isSaving}>Cancel</Button>
                <Button type="submit" disabled={isSaving || isLoadingSubmissions} className="bg-primary text-primary-foreground">
                  {isSaving && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
                  {isSaving ? "Saving…" : editingSolution ? "Save changes" : "Publish solution"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
