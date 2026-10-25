"use client";

import axios, { isAxiosError } from "axios";
import MDEditor from "@uiw/react-md-editor";
import {
  ArrowLeft,
  ArrowUp,
  Check,
  Loader2,
  MessageSquareText,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type {
  IDiscussion,
  IDiscussionComment,
} from "@/models/Discussion";
import type { CodeArenaSession } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { discussionContentSchema } from "@/schemas/discussionSchema";
import { cn } from "@/lib/utils";

type SortOption = "newest" | "upvoted" | "discussed";

interface DiscussionResponse {
  success: boolean;
  message?: string;
  discussion?: IDiscussion;
  discussions?: IDiscussion[];
  comments?: IDiscussionComment[];
  comment?: IDiscussionComment;
  hasMore?: boolean;
  nextCursor?: string | null;
  hasVoted?: boolean;
  votesCount?: number;
  removedFromCount?: boolean;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<DiscussionResponse>(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
}

function formatDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(parsed);
}

function Author({ discussion }: { discussion: IDiscussion | IDiscussionComment }) {
  if (discussion.isDeleted) {
    return <span className="text-sm text-muted-foreground">Deleted user</span>;
  }
  const name = discussion.author?.username || "CodeArena user";
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {discussion.author?.avatar ? (
        <img
          src={discussion.author.avatar}
          alt=""
          className="size-7 shrink-0 rounded-full border border-border object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="truncate text-sm font-medium">{name}</span>
    </span>
  );
}

export default function ProblemPageDiscussions({
  problemId,
  session,
}: {
  problemId: string;
  session: CodeArenaSession | null;
}) {
  const [discussions, setDiscussions] = useState<IDiscussion[]>([]);
  const [selected, setSelected] = useState<IDiscussion | null>(null);
  const [comments, setComments] = useState<IDiscussionComment[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [cursor, setCursor] = useState<string | null>(null);
  const [commentsCursor, setCommentsCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [error, setError] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postTags, setPostTags] = useState("");
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [pendingAction, setPendingAction] = useState("");

  const baseUrl = `/api/problem/${encodeURIComponent(problemId)}/discussions`;
  const canModerate = session?.user.userType === "admin";

  const loadDiscussions = useCallback(
    async (nextCursor?: string | null) => {
      if (nextCursor) setIsLoadingMore(true);
      else {
        setIsLoading(true);
        setError("");
      }
      try {
        const params = new URLSearchParams({ sort });
        if (search) params.set("q", search);
        if (nextCursor) params.set("cursor", nextCursor);
        const response = await axios.get<DiscussionResponse>(
          `${baseUrl}?${params.toString()}`,
        );
        const page = response.data.discussions ?? [];
        setDiscussions((current) => (nextCursor ? [...current, ...page] : page));
        setCursor(response.data.nextCursor ?? null);
        setHasMore(Boolean(response.data.hasMore));
      } catch (loadError) {
        const message = getErrorMessage(loadError, "Unable to load discussions.");
        setError(message);
        if (nextCursor) toast.error(message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [baseUrl, search, sort],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    void loadDiscussions();
  }, [loadDiscussions]);

  const loadComments = useCallback(
    async (discussion: IDiscussion, nextCursor?: string | null) => {
      if (!nextCursor) {
        setIsLoadingComments(true);
        setComments([]);
        setCommentsCursor(null);
      }
      try {
        const params = new URLSearchParams();
        if (nextCursor) params.set("cursor", nextCursor);
        const response = await axios.get<DiscussionResponse>(
          `${baseUrl}/${encodeURIComponent(discussion._id)}/comments?${params.toString()}`,
        );
        const page = response.data.comments ?? [];
        setComments((current) => (nextCursor ? [...current, ...page] : page));
        setCommentsCursor(response.data.nextCursor ?? null);
        setHasMoreComments(Boolean(response.data.hasMore));
      } catch (loadError) {
        toast.error(getErrorMessage(loadError, "Unable to load replies."));
      } finally {
        setIsLoadingComments(false);
      }
    },
    [baseUrl],
  );

  useEffect(() => {
    if (selected && !selected.isDeleted) void loadComments(selected);
  }, [loadComments, selected]);

  const commentGroups = useMemo(() => {
    const replies = new Map<string, IDiscussionComment[]>();
    const roots: IDiscussionComment[] = [];
    for (const comment of comments) {
      if (comment.parentCommentId) {
        const group = replies.get(comment.parentCommentId) ?? [];
        group.push(comment);
        replies.set(comment.parentCommentId, group);
      } else {
        roots.push(comment);
      }
    }
    return { roots, replies };
  }, [comments]);

  const startNewPost = () => {
    if (!session) {
      toast.error("Sign in to start a discussion.");
      return;
    }
    setPostTitle("");
    setPostContent("");
    setPostTags("");
    setEditingPost(false);
    setIsComposerOpen(true);
  };

  const startEditPost = () => {
    if (!selected) return;
    setPostTitle(selected.title);
    setPostContent(selected.content);
    setPostTags(selected.tags.join(", "));
    setEditingPost(true);
    setIsComposerOpen(true);
  };

  const savePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = {
      title: postTitle,
      content: postContent,
      tags: postTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    const parsed = discussionContentSchema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Please check your post.");
      return;
    }
    setIsSavingPost(true);
    try {
      if (editingPost && selected) {
        await axios.patch(`${baseUrl}/${encodeURIComponent(selected._id)}`, parsed.data);
        const updated = {
          ...selected,
          ...parsed.data,
          tags: Array.from(new Set(parsed.data.tags)),
          updatedAt: new Date().toISOString(),
        };
        setSelected(updated);
        setDiscussions((items) =>
          items.map((item) => (item._id === updated._id ? updated : item)),
        );
        toast.success("Discussion updated.");
      } else {
        const response = await axios.post<DiscussionResponse>(baseUrl, parsed.data);
        if (!response.data.discussion) throw new Error("The server returned no discussion.");
        const created = response.data.discussion;
        setDiscussions((items) => [created, ...items]);
        setSelected(created);
        setSearchInput("");
        setSearch("");
        setSort("newest");
        toast.success("Discussion posted.");
      }
      setIsComposerOpen(false);
    } catch (saveError) {
      toast.error(getErrorMessage(saveError, "Unable to save your discussion."));
    } finally {
      setIsSavingPost(false);
    }
  };

  const deletePost = async () => {
    if (!selected || !window.confirm("Delete this discussion?")) return;
    setPendingAction("delete-post");
    try {
      await axios.delete(`${baseUrl}/${encodeURIComponent(selected._id)}`);
      setDiscussions((items) => items.filter((item) => item._id !== selected._id));
      setSelected(null);
      toast.success("Discussion deleted.");
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, "Unable to delete this discussion."));
    } finally {
      setPendingAction("");
    }
  };

  const toggleVote = async (discussion: IDiscussion) => {
    if (!session) {
      toast.error("Sign in to vote on a discussion.");
      return;
    }
    setPendingAction(`vote-${discussion._id}`);
    try {
      const response = await axios.post<DiscussionResponse>(
        `${baseUrl}/${encodeURIComponent(discussion._id)}/vote`,
      );
      const update = (post: IDiscussion) =>
        post._id === discussion._id
          ? {
              ...post,
              hasVoted: Boolean(response.data.hasVoted),
              votesCount: response.data.votesCount ?? post.votesCount,
            }
          : post;
      setDiscussions((items) => items.map(update));
      setSelected((post) => (post ? update(post) : post));
    } catch (voteError) {
      toast.error(getErrorMessage(voteError, "Unable to update your vote."));
    } finally {
      setPendingAction("");
    }
  };

  const submitComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    if (replyContent.trim().length < 2 || replyContent.length > 10000) {
      toast.error("Reply must be between 2 and 10,000 characters.");
      return;
    }
    setIsSavingComment(true);
    try {
      const response = await axios.post<DiscussionResponse>(
        `${baseUrl}/${encodeURIComponent(selected._id)}/comments`,
        { content: replyContent, parentCommentId: replyTo },
      );
      if (!response.data.comment) throw new Error("The server returned no reply.");
      setComments((items) => [...items, response.data.comment!]);
      setReplyContent("");
      setReplyTo(null);
      const incremented = (post: IDiscussion) =>
        post._id === selected._id
          ? { ...post, commentsCount: post.commentsCount + 1 }
          : post;
      setSelected((post) => (post ? incremented(post) : post));
      setDiscussions((items) => items.map(incremented));
      toast.success("Reply posted.");
    } catch (commentError) {
      toast.error(getErrorMessage(commentError, "Unable to post your reply."));
    } finally {
      setIsSavingComment(false);
    }
  };

  const saveCommentEdit = async (comment: IDiscussionComment) => {
    if (!selected) return;
    if (editingCommentContent.trim().length < 2 || editingCommentContent.length > 10000) {
      toast.error("Reply must be between 2 and 10,000 characters.");
      return;
    }
    setPendingAction(`edit-${comment._id}`);
    try {
      await axios.patch(
        `${baseUrl}/${encodeURIComponent(selected._id)}/comments/${encodeURIComponent(comment._id)}`,
        { content: editingCommentContent },
      );
      setComments((items) =>
        items.map((item) =>
          item._id === comment._id
            ? { ...item, content: editingCommentContent.trim(), updatedAt: new Date().toISOString() }
            : item,
        ),
      );
      setEditingCommentId(null);
      toast.success("Reply updated.");
    } catch (editError) {
      toast.error(getErrorMessage(editError, "Unable to update this reply."));
    } finally {
      setPendingAction("");
    }
  };

  const deleteComment = async (comment: IDiscussionComment) => {
    if (!selected || !window.confirm("Delete this reply?")) return;
    setPendingAction(`delete-${comment._id}`);
    try {
      const response = await axios.delete<DiscussionResponse>(
        `${baseUrl}/${encodeURIComponent(selected._id)}/comments/${encodeURIComponent(comment._id)}`,
      );
      if (response.data.removedFromCount) {
        setComments((items) => items.filter((item) => item._id !== comment._id));
        const decrement = (post: IDiscussion) =>
          post._id === selected._id
            ? { ...post, commentsCount: Math.max(0, post.commentsCount - 1) }
            : post;
        setSelected((post) => (post ? decrement(post) : post));
        setDiscussions((items) => items.map(decrement));
      } else {
        setComments((items) =>
          items.map((item) =>
            item._id === comment._id
              ? { ...item, isDeleted: true, content: "" }
              : item,
          ),
        );
      }
      toast.success("Reply deleted.");
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, "Unable to delete this reply."));
    } finally {
      setPendingAction("");
    }
  };

  const canEdit = (authorUid: string) =>
    Boolean(session && (session.user.uid === authorUid || canModerate));

  const renderComment = (comment: IDiscussionComment, nested = false) => (
    <article
      key={comment._id}
      className={cn(
        "border-t border-border py-4",
        nested && "ml-5 border-l-2 border-l-primary/30 pl-4 sm:ml-10",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Author discussion={comment} />
          <time className="text-xs text-muted-foreground" dateTime={comment.createdAt}>
            {formatDate(comment.createdAt)}
          </time>
        </div>
        {canEdit(comment.authorUid) && !comment.isDeleted && (
          <div className="flex gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Edit reply"
              onClick={() => {
                setEditingCommentId(comment._id);
                setEditingCommentContent(comment.content);
              }}
            >
              <Pencil aria-hidden="true" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Delete reply"
              disabled={pendingAction === `delete-${comment._id}`}
              onClick={() => void deleteComment(comment)}
            >
              {pendingAction === `delete-${comment._id}` ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <Trash2 aria-hidden="true" />
              )}
            </Button>
          </div>
        )}
      </div>

      {comment.isDeleted ? (
        <p className="mt-3 text-sm italic text-muted-foreground">This reply was deleted.</p>
      ) : editingCommentId === comment._id ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={editingCommentContent}
            onChange={(event) => setEditingCommentContent(event.target.value)}
            maxLength={10000}
            rows={3}
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pendingAction === `edit-${comment._id}`}
              onClick={() => void saveCommentEdit(comment)}
            >
              {pendingAction === `edit-${comment._id}` ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Check />
              )}
              Save
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{comment.content}</p>
      )}

      {session && !comment.isDeleted && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 text-muted-foreground"
          onClick={() => {
            setReplyTo(comment._id);
            setReplyContent("");
          }}
        >
          Reply
        </Button>
      )}
      {commentGroups.replies.get(comment._id)?.map((reply) => renderComment(reply, true))}
    </article>
  );

  return (
    <section className="min-h-[calc(100vh-7rem)] bg-card px-3 py-4 sm:px-5">
      {selected ? (
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2"
            onClick={() => {
              setSelected(null);
              setComments([]);
            }}
          >
            <ArrowLeft aria-hidden="true" /> All discussions
          </Button>

          {selected.isDeleted ? (
            <p className="py-10 text-center text-muted-foreground">This discussion was deleted.</p>
          ) : (
            <>
              <header className="border-b border-border pb-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-xl font-semibold sm:text-2xl">
                      {selected.title}
                    </h2>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                      <Author discussion={selected} />
                      <time
                        className="text-xs text-muted-foreground"
                        dateTime={selected.createdAt}
                      >
                        {formatDate(selected.createdAt)}
                      </time>
                    </div>
                  </div>
                  {canEdit(selected.authorUid) && (
                    <div className="flex gap-1">
                      <Button type="button" size="sm" variant="outline" onClick={startEditPost}>
                        <Pencil aria-hidden="true" /> Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pendingAction === "delete-post"}
                        onClick={() => void deletePost()}
                      >
                        {pendingAction === "delete-post" ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Trash2 aria-hidden="true" />
                        )}
                        Delete
                      </Button>
                    </div>
                  )}
                </div>

                {selected.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selected.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="prose prose-sm mt-5 max-w-none break-words dark:prose-invert">
                  <MDEditor.Markdown source={selected.content} />
                </div>
                <div className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
                  <Button
                    type="button"
                    variant={selected.hasVoted ? "secondary" : "outline"}
                    size="sm"
                    disabled={pendingAction === `vote-${selected._id}`}
                    aria-pressed={selected.hasVoted}
                    onClick={() => void toggleVote(selected)}
                    className={selected.hasVoted ? "text-primary" : ""}
                  >
                    {pendingAction === `vote-${selected._id}` ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <ArrowUp aria-hidden="true" />
                    )}
                    {selected.votesCount} upvotes
                  </Button>
                  <span className="inline-flex items-center gap-1.5">
                    <MessageSquareText aria-hidden="true" className="size-4" />
                    {selected.commentsCount} replies
                  </span>
                </div>
              </header>

              <section className="pt-5" aria-label="Replies">
                <h3 className="text-lg font-semibold">Replies ({selected.commentsCount})</h3>
                {session ? (
                  <form onSubmit={submitComment} className="mt-4 rounded-lg border border-border bg-background p-3">
                    {replyTo && (
                      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Replying to a comment</span>
                        <button type="button" onClick={() => setReplyTo(null)} className="text-primary hover:underline">
                          Cancel reply
                        </button>
                      </div>
                    )}
                    <textarea
                      value={replyContent}
                      onChange={(event) => setReplyContent(event.target.value)}
                      placeholder="Write a helpful reply…"
                      maxLength={10000}
                      rows={3}
                      className="w-full resize-y bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    <div className="mt-2 flex justify-end">
                      <Button type="submit" size="sm" disabled={isSavingComment || replyContent.trim().length < 2}>
                        {isSavingComment ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Send aria-hidden="true" />
                        )}
                        Reply
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p className="mt-4 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                    <Link className="text-primary hover:underline" href="/sign-in">Sign in</Link> to join the discussion.
                  </p>
                )}

                {isLoadingComments ? (
                  <div className="space-y-4 py-5">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No replies yet. Start the conversation with a helpful comment.
                  </p>
                ) : (
                  <div className="mt-3">
                    {commentGroups.roots.map((comment) => renderComment(comment))}
                    {hasMoreComments && commentsCursor && (
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4 w-full"
                        onClick={() => void loadComments(selected, commentsCursor)}
                      >
                        Load more replies
                      </Button>
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Problem discussions</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask questions and share ideas about this problem.
              </p>
            </div>
            {session ? (
              <Button type="button" className="shrink-0" onClick={startNewPost}>
                <Plus aria-hidden="true" /> Start a Discussion
              </Button>
            ) : (
              <Button type="button" variant="outline" asChild className="shrink-0">
                <Link href="/sign-in">Sign in to discuss</Link>
              </Button>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search titles or post content"
                aria-label="Search discussions"
                className="pl-9"
              />
            </div>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              aria-label="Sort discussions"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="newest">Newest</option>
              <option value="upvoted">Most upvoted</option>
              <option value="discussed">Most discussed</option>
            </select>
          </div>

          {isLoading ? (
            <div className="mt-5 space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : error ? (
            <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button type="button" variant="outline" className="mt-3" onClick={() => void loadDiscussions()}>
                Retry
              </Button>
            </div>
          ) : discussions.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border px-5 py-12 text-center">
              <MessageSquareText aria-hidden="true" className="mx-auto size-8 text-primary" />
              <h3 className="mt-3 font-semibold">
                {search ? "No matching discussions" : "No discussions yet"}
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                {search
                  ? "Try a different search term."
                  : "Start a problem-specific discussion and help others learn."}
              </p>
              {!search && session && (
                <Button type="button" className="mt-4" onClick={startNewPost}>
                  <Plus aria-hidden="true" /> Start a Discussion
                </Button>
              )}
            </div>
          ) : (
            <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
              {discussions.map((discussion) => (
                <article key={discussion._id} className="flex gap-3 p-4 transition-colors hover:bg-accent/40 sm:gap-4">
                  <Button
                    type="button"
                    variant={discussion.hasVoted ? "secondary" : "outline"}
                    size="sm"
                    className={cn(
                      "mt-0.5 h-fit shrink-0 flex-col gap-0 px-2 py-1.5",
                      discussion.hasVoted && "text-primary",
                    )}
                    aria-label={`${discussion.hasVoted ? "Remove upvote" : "Upvote"} (${discussion.votesCount})`}
                    aria-pressed={discussion.hasVoted}
                    disabled={pendingAction === `vote-${discussion._id}`}
                    onClick={() => void toggleVote(discussion)}
                  >
                    {pendingAction === `vote-${discussion._id}` ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowUp aria-hidden="true" className="size-4" />
                    )}
                    <span className="text-xs">{discussion.votesCount}</span>
                  </Button>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setSelected(discussion)}
                      className="block max-w-full text-left font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="line-clamp-2 break-words">{discussion.title}</span>
                    </button>
                    <p className="mt-1 line-clamp-2 break-words text-sm leading-6 text-muted-foreground">
                      {discussion.content.replace(/[#>*_`~\[\]()]/g, " ").replace(/\s+/g, " ").trim()}
                    </p>
                    {discussion.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {discussion.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                      <Author discussion={discussion} />
                      <time dateTime={discussion.createdAt}>{formatDate(discussion.createdAt)}</time>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquareText aria-hidden="true" className="size-3.5" />
                        {discussion.commentsCount}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
              {hasMore && cursor && (
                <div className="p-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isLoadingMore}
                    onClick={() => void loadDiscussions(cursor)}
                  >
                    {isLoadingMore && <Loader2 className="animate-spin" />}
                    Load more discussions
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {isComposerOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/70 p-3 sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSavingPost) {
              setIsComposerOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="discussion-editor-title"
            className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-2xl sm:p-6"
          >
            <header className="flex items-center justify-between gap-3">
              <h2 id="discussion-editor-title" className="text-xl font-semibold">
                {editingPost ? "Edit discussion" : "Start a Discussion"}
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close discussion editor"
                disabled={isSavingPost}
                onClick={() => setIsComposerOpen(false)}
              >
                <X aria-hidden="true" />
              </Button>
            </header>
            <form onSubmit={savePost} className="mt-5 space-y-4">
              <label className="block space-y-1.5 text-sm font-medium">
                Title
                <Input
                  value={postTitle}
                  onChange={(event) => setPostTitle(event.target.value)}
                  placeholder="What would you like to discuss?"
                  maxLength={120}
                  required
                />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                Post content <span className="font-normal text-muted-foreground">(Markdown supported)</span>
                <textarea
                  value={postContent}
                  onChange={(event) => setPostContent(event.target.value)}
                  placeholder="Share your question, approach, or insight…"
                  maxLength={20000}
                  rows={9}
                  required
                  className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                Tags <span className="font-normal text-muted-foreground">(optional, comma-separated)</span>
                <Input
                  value={postTags}
                  onChange={(event) => setPostTags(event.target.value)}
                  placeholder="arrays, dynamic programming"
                  maxLength={240}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Use Markdown for code, lists, and emphasis. Posts are public to anyone viewing this problem.
              </p>
              <footer className="flex flex-col-reverse justify-end gap-2 pt-1 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSavingPost}
                  onClick={() => setIsComposerOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSavingPost}>
                  {isSavingPost ? <Loader2 className="animate-spin" /> : <Send aria-hidden="true" />}
                  {isSavingPost ? "Saving…" : editingPost ? "Save changes" : "Post discussion"}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
