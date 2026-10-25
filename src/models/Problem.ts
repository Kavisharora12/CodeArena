import type { ISimilarQuestion } from "./SimilarQuestion";
import type { ISolution } from "./Solution";

export interface ITestCase {
  input: string;
  output: string;
}

export interface IProblem {
  _id?: string;
  title: string;
  level: string;
  description: string;
  examples: string;
  constraints: string;
  testCases?: ITestCase[];
  like?: number;
  dislike?: number;
  topics: string;
  companies?: string;
  similarQuestions: string[] | ISimilarQuestion[];
  solutions: string[] | ISolution[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
