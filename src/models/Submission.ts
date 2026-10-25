export interface ISubmission {
  _id?: string;
  userId: string;
  status: string;
  language: string;
  time: number;
  memory: number | null;
  sourceCode: string;
  problemId: string;
  contestId?: string;
  passedTestCases?: number;
  totalTestCases?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
