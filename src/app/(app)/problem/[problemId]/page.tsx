"use client";
import React, { useCallback, useEffect, useState } from 'react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import ProblemPageNavigation from '@/components/ProblemPageNavigation';
import { ScrollArea } from "@/components/ui/scroll-area"
import ProblemSideFooter from '@/components/ProblemPageSideFooter';
import { useParams, useSearchParams } from 'next/navigation.js';

import { firestoreDocumentId } from '@/schemas/similarQuestionSchema';
import { toast } from 'sonner';
import axios from 'axios';
import {
  ApiResponse,
  CodeExecutionDiagnostic,
  CodeExecutionResult,
  codeSubmissionResultType,
} from '@/types/ApiResponse';
import { IProblem } from '@/models/Problem.js';
import { Skeleton } from "@/components/ui/skeleton"
import ProblemPageDescription from '@/components/ProblemPageDescription';

import ProblemPageCodeEditor from '@/components/ProblemPageCodeEditor';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { CloudUpload, Loader2, Play, Sparkles } from 'lucide-react';

import { useSession } from "@/context/AuthProvider";
import ProblemPageSoluction from '@/components/ProblemPageSoluction';
import ProblemPageSubmission from '@/components/ProblemPageSubmission';
import ProblemPageTestResult from '@/components/ProblemPageTestResult';
import ProblemPageAiTab from '@/components/ProblemPageAiTab';
import ProblemPageDiscussions from '@/components/ProblemPageDiscussions';
import {
  ACTIVITY_RECORDED_EVENT,
  WORKSPACE_BUSY_EVENT,
  workspaceActionEvent,
} from '@/lib/workspaceEvents';

export default function ProblemWorkspacePage() {
  const [mounted, setMounted] = useState<boolean>(false);
  const pathname = useParams();
  const { problemId } = pathname;
  const searchParams = useSearchParams();
  const contestId = searchParams.get("contestId");
  const { theme } = useTheme()
  const { data: session } = useSession();
  const [problemInfo, setProblemInfo] = useState<IProblem | null>(null);

  const [sourceCode, setSourceCode] = useState<string>("");
  const [customInput, setCustomInput] = useState("");
  const [currentTab, setCurrentTab] = useState<string>("description");
  const [submissionOutput, setSubmissionOutput] = useState<codeSubmissionResultType | null>(null);
  const [executionDiagnostic, setExecutionDiagnostic] = useState<CodeExecutionDiagnostic | null>(null);
  const [runResult, setRunResult] = useState<CodeExecutionResult | null>(null);
  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchProblemDetails = async () => {
      if (!mounted) return null;

      try {
        const parsedData = firestoreDocumentId.safeParse(problemId);

        if (!parsedData.success) {
          console.log("Invalid Problem Id: ", problemId);
          toast.error("Invalid Problem Id");
          return;
        }

        const res = await axios.get<ApiResponse>(`/api/problem/get-problem?problemId=${problemId}`);

        setProblemInfo(res.data.problem || null);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          toast.error(error.response.data.message);
          console.log("Problem fetching route error: ", error.response.data.message)
        } else {
          toast.error("Error while fetching error");
          console.log("Error while fetching error: ", error);
        }
      }
    }

    fetchProblemDetails();
  }, [mounted, problemId]);

  const handleCodeRun = useCallback(async () => {
    if (!session?.user || !problemInfo) {
      toast.error("Sign in to run code.");
      return;
    }
    setIsCodeRunning(true);
    window.dispatchEvent(new CustomEvent(WORKSPACE_BUSY_EVENT, { detail: true }));
    setCurrentTab("testResult");
    setSubmissionOutput(null);
    setExecutionDiagnostic(null);
    setRunResult(null);
    try {
      const response = await axios.post<ApiResponse>("/api/code/run-code", {
        problemId: String(problemInfo._id ?? problemId),
        sourceCode,
        input: customInput,
      });
      setRunResult(response.data.result ?? null);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? "Unable to run your code."
        : "Unable to run your code.";
      toast.error(message);
    } finally {
      setIsCodeRunning(false);
      window.dispatchEvent(new CustomEvent(WORKSPACE_BUSY_EVENT, { detail: false }));
    }
  }, [session?.user, problemInfo, problemId, sourceCode, customInput]);

  const handleCodeSubmission = useCallback(async () => {
    if (!session?.user || !problemInfo) {
      toast.error("Sign in to submit code.");
      return;
    }
    setIsSubmitLoading(true);
    window.dispatchEvent(new CustomEvent(WORKSPACE_BUSY_EVENT, { detail: true }));
    setCurrentTab("testResult");
    setRunResult(null);
    setSubmissionOutput(null);
    setExecutionDiagnostic(null);
    try {
      const response = await axios.post<ApiResponse>("/api/code/submit-code", {
        problemId: String(problemInfo._id ?? problemId),
        sourceCode,
        ...(contestId ? { contestId } : {}),
      });
      if (!response.data.submissionOutput) {
        throw new Error("The grading service returned no submission record.");
      }
      setSubmissionOutput(response.data.submissionOutput);
      setExecutionDiagnostic(response.data.executionDiagnostic ?? null);
      window.dispatchEvent(new Event(ACTIVITY_RECORDED_EVENT));
      if (response.data.submissionOutput.status === "Accepted") {
        toast.success(
          `Accepted: ${response.data.passedTestCases}/${response.data.totalTestCases} test cases passed.`,
        );
      } else {
        toast.error(
          `${response.data.submissionOutput.status}: ${response.data.passedTestCases ?? 0}/${response.data.totalTestCases ?? 0} test cases passed.`,
        );
      }
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ??
          (error.response
            ? `Submission request failed (HTTP ${error.response.status}).`
            : "Could not reach the submission API. Check the server output and try again.")
        : error instanceof Error
          ? error.message
          : "Unable to submit your code.";
      toast.error(message);
    } finally {
      setIsSubmitLoading(false);
      window.dispatchEvent(new CustomEvent(WORKSPACE_BUSY_EVENT, { detail: false }));
    }
  }, [session?.user, problemInfo, problemId, sourceCode, contestId]);

  useEffect(() => {
    const run = () => void handleCodeRun();
    const submit = () => void handleCodeSubmission();
    const assistant = () => setCurrentTab("chatBot");
    window.addEventListener(workspaceActionEvent("run"), run);
    window.addEventListener(workspaceActionEvent("submit"), submit);
    window.addEventListener(workspaceActionEvent("assistant"), assistant);
    return () => {
      window.removeEventListener(workspaceActionEvent("run"), run);
      window.removeEventListener(workspaceActionEvent("submit"), submit);
      window.removeEventListener(workspaceActionEvent("assistant"), assistant);
    };
  }, [handleCodeRun, handleCodeSubmission]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="w-full h-[calc(100vh-3rem)] px-3 py-2">
      <div className="absolute left-0 top-1.5 flex w-full items-center justify-center lg:hidden">
        <div className="flex gap-1">
          <Button onClick={handleCodeRun} disabled={!session?.user || isCodeRunning || isSubmitLoading} title="Run JavaScript with the custom stdin in the Test Result tab." aria-label="Run JavaScript" variant="secondary" className='relative z-40'>
            {isCodeRunning ? <Loader2 className="size-5 animate-spin" /> : <Play />}
          </Button>
          <Button onClick={handleCodeSubmission} disabled={!session?.user || isCodeRunning || isSubmitLoading} variant="secondary" className='w-30 relative z-40 text-base flex items-center gap-2 font-semibold'>
            {isSubmitLoading ? <><Loader2 className='resize-custom w-5 animate-spin' />Grading</> : <><CloudUpload className='resize-custom w-5' /> Submit</>}
          </Button>
          <Button onClick={() => setCurrentTab("chatBot")} disabled={session?.user ? false : true} variant="secondary" className='cursor-pointer relative z-40'><Sparkles /></Button>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="w-full gap-1">
        <ResizablePanel defaultSize={50} minSize={31} className='rounded-md bg-[var(--sidebar-accent)] border'>
          <ProblemPageNavigation currentTab={currentTab} setCurrentTab={setCurrentTab} />

          <ScrollArea className='relative w-full h-[calc(100vh-3.5rem-3rem)]'>
            {!problemInfo && <div style={{ background: "var(--card)" }} className='absolute left-0 top-0 w-full h-full z-[90] p-4'>
              <Skeleton className="h-8 w-36 rounded-md" />
              <Skeleton className="h-8 w-[18rem] rounded-md mt-10" />
              <Skeleton className="h-48 w-full rounded-md mt-4" />
              <Skeleton className="h-52 w-full rounded-md mt-4" />
            </div>
            }

            {(problemInfo && currentTab === "description") && <ProblemPageDescription problemInfo={problemInfo} session={session} />}
            {(problemInfo && currentTab === "solutions") && <ProblemPageSoluction problemId={problemId?.toString() || ""} currentCode={sourceCode} />}
            {(problemInfo && currentTab === "discussion") && <ProblemPageDiscussions problemId={problemId?.toString() || ""} session={session} />}
            {(problemInfo && currentTab === "submissions") && <ProblemPageSubmission theme={theme} problemInfo={problemInfo} setCurrentTab={setCurrentTab} setSubmissionOutput={setSubmissionOutput} />}
            {(problemInfo && currentTab === "testResult") && <ProblemPageTestResult submissionOutput={submissionOutput} setSubmissionOutput={setSubmissionOutput} executionDiagnostic={executionDiagnostic} runResult={runResult} customInput={customInput} setCustomInput={setCustomInput} onRun={handleCodeRun} isRunning={isCodeRunning} />}
            {(problemInfo && currentTab === "chatBot") && <ProblemPageAiTab sourceCode={sourceCode} theme={theme} />}
            <ProblemSideFooter />
          </ScrollArea>

        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50} minSize={30} className='rounded-md'>
          <ProblemPageCodeEditor theme={theme} sourceCode={sourceCode} setSourceCode={setSourceCode} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
