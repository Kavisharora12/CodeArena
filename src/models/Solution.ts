import type { IUser } from "./User";

export interface ISolution {
  _id?: string;
  userId: string | Pick<IUser, "_id" | "uid" | "username" | "avatar">;
  problemId: string;
  tags: string[];
  title: string;
  language?: string;
  explanation?: string;
  code?: string;
  sourceCode: string;
  isOfficial?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
