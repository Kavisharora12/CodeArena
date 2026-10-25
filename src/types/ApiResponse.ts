import { IProblem } from "@/models/Problem";
import { ISolution } from "@/models/Solution";
import { ISubmission } from "@/models/Submission";
import { IUser } from "@/models/User";

export interface codeSubmissionResultType {
    _id?: string,
    userId: string,
    status: string,
    language: string,
    time: number,
    memory: number | null,
    sourceCode: string,
    problemId: string | IProblem,
    contestId?: string,
    passedTestCases?: number;
    totalTestCases?: number;
    createdAt?: Date,
    udpatedAt?: Date
}

export interface CodeExecutionResult {
    status: "Finished" | "Syntax Error" | "Runtime Error" | "Time Limit Exceeded" | "Output Limit Exceeded";
    stdout: string;
    stderr: string;
    runtimeMs: number;
    exitCode: number | null;
    error: string | null;
}

export interface CodeExecutionDiagnostic {
    testCaseNumber: number;
    status: CodeExecutionResult["status"];
    exitCode: number | null;
    runtimeMs: number;
    error: string | null;
    stderr: string;
}

export interface ApiResponse {
    success: boolean,
    message: string,
    user?: IUser,
    userId?: string,
    solutions?: string[] | ISolution[],
    submissions?: string[] | codeSubmissionResultType[],
    solvedQuestions?: string[],
    submissionOutput?: codeSubmissionResultType,
    problemId?: string,
    problem?: IProblem,
    result?: CodeExecutionResult,
    executionDiagnostic?: CodeExecutionDiagnostic,
    passedTestCases?: number,
    totalTestCases?: number,
    solution?: ISolution,
    allProblems?: IProblem[],
    output?: string,
    submissionDetails?: ISubmission
}