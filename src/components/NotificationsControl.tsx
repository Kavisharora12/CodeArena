"use client";

import axios from "axios";
import { Bell, Loader2, Plus, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { CodeArenaSession } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Notice {
  id: string;
  title: string;
  message: string;
  createdAt: string | null;
}

export default function NotificationsControl({
  session,
}: {
  session: CodeArenaSession;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const isAdmin = session.user.userType === "admin";

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setOpen(false);
        setComposerOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setComposerOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const loadNotifications = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const response = await axios.get<{ notifications?: Notice[] }>("/api/notifications");
      setNotices(response.data.notifications ?? []);
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message ?? "Unable to load notifications."
        : "Unable to load notifications.";
      setLoadError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOpen = () => {
    const shouldOpen = !open;
    setOpen(shouldOpen);
    if (shouldOpen) void loadNotifications();
  };

  const publishNotification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await axios.post("/api/notifications", { title, message });
      setTitle("");
      setMessage("");
      setComposerOpen(false);
      toast.success("Announcement published.");
      await loadNotifications();
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message ?? "Unable to publish announcement."
        : "Unable to publish announcement.";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        aria-expanded={open}
        aria-controls="codearena-notifications"
        title="Notifications"
        className="size-9"
        onClick={toggleOpen}
      >
        <Bell aria-hidden="true" className="size-5" />
      </Button>
      {open && (
        <section
          id="codearena-notifications"
          aria-label="Announcements"
          className="absolute right-0 top-full z-[100] mt-2 max-h-[min(70vh,30rem)] w-[min(21rem,calc(100vw-1rem))] overflow-y-auto rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-xl"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold">Announcements</h2>
              <p className="text-xs text-muted-foreground">Updates from CodeArena admins</p>
            </div>
            {isAdmin && !composerOpen && (
              <Button type="button" variant="outline" size="sm" onClick={() => setComposerOpen(true)}>
                <Plus aria-hidden="true" className="size-4" />
                Add
              </Button>
            )}
            {composerOpen && (
              <Button type="button" variant="ghost" size="icon" aria-label="Close announcement form" onClick={() => setComposerOpen(false)}>
                <X aria-hidden="true" className="size-4" />
              </Button>
            )}
          </div>

          {composerOpen && isAdmin && (
            <form onSubmit={(event) => void publishNotification(event)} className="mb-4 space-y-2 rounded-md border bg-background p-3">
              <label htmlFor="announcement-title" className="text-xs font-medium">Title</label>
              <Input
                id="announcement-title"
                required
                minLength={3}
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Announcement title"
              />
              <label htmlFor="announcement-message" className="block text-xs font-medium">Message</label>
              <textarea
                id="announcement-message"
                required
                minLength={3}
                maxLength={2_000}
                rows={4}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Share an update with all users."
                className="w-full resize-y rounded-md border bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button type="submit" size="sm" disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Send aria-hidden="true" className="size-4" />}
                {isSaving ? "Publishing…" : "Publish to all users"}
              </Button>
            </form>
          )}

          {isLoading && (
            <p role="status" className="flex items-center gap-2 py-5 text-sm text-muted-foreground">
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              Loading announcements…
            </p>
          )}
          {!isLoading && loadError && (
            <div role="alert" className="text-sm">
              <p>{loadError}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => void loadNotifications()}>Try again</Button>
            </div>
          )}
          {!isLoading && !loadError && notices.length === 0 && (
            <p className="py-5 text-center text-sm text-muted-foreground">No announcements yet.</p>
          )}
          {!isLoading && !loadError && notices.length > 0 && (
            <ul className="space-y-3">
              {notices.map((notice) => (
                <li key={notice.id} className="border-t pt-3 first:border-0 first:pt-0">
                  <h3 className="text-sm font-semibold">{notice.title}</h3>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{notice.message}</p>
                  {notice.createdAt && (
                    <time className="mt-2 block text-[11px] text-muted-foreground" dateTime={notice.createdAt}>
                      {new Date(notice.createdAt).toLocaleString()}
                    </time>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
