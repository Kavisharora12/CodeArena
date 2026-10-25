export interface IDiscussionAuthor {
  uid: string;
  username: string;
  avatar: string;
}

export interface IDiscussion {
  _id: string;
  problemId: string;
  authorUid: string;
  author: IDiscussionAuthor | null;
  title: string;
  content: string;
  tags: string[];
  votesCount: number;
  commentsCount: number;
  hasVoted: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IDiscussionComment {
  _id: string;
  discussionId: string;
  authorUid: string;
  author: IDiscussionAuthor | null;
  content: string;
  parentCommentId: string | null;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}
