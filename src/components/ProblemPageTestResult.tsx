"use client";

import type { Dispatch, SetStateAction } from "react";
import { ShieldAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  CodeExecutionDiagnostic,
  CodeExecutionResult,
  codeSubmissionResultType,
} from "@/types/ApiResponse";

interface ProblemPageTestResultProps {
  submissionOutput: codeSubmissionResultType | null;
  setSubmissionOutput: Dispatch<SetStateAction<codeSubmissionResultType | null>>;
  executionDiagnostic: CodeExecutionDiagnostic | null;
  runResult: CodeExecutionResult | null;
  customInput: string;
  setCustomInput: Dispatch<SetStateAction<string>>;
  onRun: () => void;
  isRunning: boolean;
}

export default function ProblemPageTestResult({
  submissionOutput,
  setSubmissionOutput,
  executionDiagnostic,
  runResult,
  customInput,
  setCustomInput,
  onRun,
  isRunning,
}: ProblemPageTestResultProps) {
  if (submissionOutput) {
    return (
      <section className="min-h-[calc(100vh-6.5rem)] bg-[var(--card)] p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Historical submission record
            </p>
            <h2
              className={`mt-1 text-xl font-semibold ${
                submissionOutput.status === "Accepted" ? "text-green-500" : "text-red-500"
              }`}
            >
              {submissionOutput.status}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {submissionOutput.language} ·{" "}
              {submissionOutput.createdAt
                ? new Date(submissionOutput.createdAt).toLocaleString()
                : "Date unavailable"}
            </p>
            {submissionOutput.totalTestCases !== undefined && (
              <p className="mt-2 text-sm">
                Passed {submissionOutput.passedTestCases ?? 0} / {submissionOutput.totalTestCases} test cases
              </p>
            )}
          </div>
          <Button type="button" variant="outline" onClick={() => setSubmissionOutput(null)}>
            <X aria-hidden="true" /> Close
          </Button>
        </div>
        {executionDiagnostic && (
          <div className="mt-4 space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <h3 className="font-semibold text-destructive">
              Development diagnostic · test case {executionDiagnostic.testCaseNumber}
            </h3>
            <p className="text-sm text-muted-foreground">
              Exit code: {executionDiagnostic.exitCode ?? "process terminated"} ·{" "}
              {executionDiagnostic.runtimeMs.toFixed(2)} ms
            </p>
            {executionDiagnostic.error && (
              <pre className="overflow-auto whitespace-pre-wrap break-words text-sm text-destructive">
                {executionDiagnostic.error}
              </pre>
            )}
            {executionDiagnostic.stderr && (
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-background p-3 font-mono text-xs">
                {executionDiagnostic.stderr}
              </pre>
            )}
            {!executionDiagnostic.error && !executionDiagnostic.stderr && (
              <p className="text-sm text-muted-foreground">
                The process exited unsuccessfully without writing an error to stderr.
              </p>
            )}
          </div>
        )}
        <pre className="mt-5 max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-background p-4 text-sm">
          {submissionOutput.sourceCode}
        </pre>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-6.5rem)] space-y-4 bg-[var(--card)] p-4 sm:p-6">
      <div className="rounded-xl border border-border bg-background p-4">
        <h2 className="font-semibold">Custom input (stdin)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Run executes your current JavaScript against this input only. Submit uses hidden
          server-side test cases.
        </p>
        <textarea
          value={customInput}
          onChange={(event) => setCustomInput(event.target.value)}
          maxLength={16 * 1024}
          rows={5}
          aria-label="Custom input for JavaScript run"
          placeholder="Enter standard input for your program"
          className="mt-3 w-full resize-y rounded-md border border-input bg-[var(--card)] px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="button" className="mt-3" onClick={onRun} disabled={isRunning}>
          {isRunning ? "Running..." : "Run with this input"}
        </Button>
      </div>

      {!runResult ? (
        <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
          <ShieldAlert aria-hidden="true" className="mb-2 size-5 text-primary" />
          Run your code to see stdout, stderr, errors, and runtime here.
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-border bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={`font-semibold ${runResult.status === "Finished" ? "text-green-500" : "text-red-500"}`}>
              {runResult.status}
            </h3>
            <span className="text-sm text-muted-foreground">{runResult.runtimeMs.toFixed(2)} ms</span>
          </div>
          {runResult.error && (
            <pre className="overflow-auto whitespace-pre-wrap break-words rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {runResult.error}
            </pre>
          )}
          <div>
            <h4 className="mb-1 text-sm font-medium">stdout</h4>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-[var(--card)] p-3 text-sm">
              {runResult.stdout || "(no output)"}
            </pre>
          </div>
          {runResult.stderr && (
            <div>
              <h4 className="mb-1 text-sm font-medium text-amber-500">stderr</h4>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-[var(--card)] p-3 text-sm text-amber-500">
                {runResult.stderr}
              </pre>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
