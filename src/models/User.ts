import type { IProblem } from "./Problem";

export interface IUser {
  _id?: string;
  uid: string;
  username: string;
  email: string;
  password?: never;
  avatar: string;
  userType?: string;
  bio?: string;
  country?: string;
  university?: string;
  github?: string;
  linkdin?: string;
  isVerified?: boolean;
  solvedProblems: number;
  skills: string[];
  solutions: string[];
  submissions: string[];
  solvedQuestions: IProblem[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
