"use client";

import Link from "next/link";
import type { CodeArenaSession } from "@/context/AuthProvider";
import { cn } from "@/lib/utils";

interface NavLinksProps {
  session: CodeArenaSession | null;
  pathname: string;
  className?: string;
  onNavigate?: () => void;
}

export default function NavLinks({
  session,
  pathname,
  className,
  onNavigate,
}: NavLinksProps) {
  const links = [
    { href: "/problems", label: "Problems" },
    { href: "/solution", label: "Discuss" },
    { href: "/about", label: "Explore" },
    { href: "/store", label: "Store" },
    { href: "/contests", label: "Contests" },
    ...(session?.user.userType === "admin"
      ? [{ href: "/add-problem", label: "Add Problem" }]
      : []),
  ];

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "flex",
        onNavigate
          ? "flex-col gap-1"
          : "items-center gap-1",
        className,
      )}
    >
      {links.map(({ href, label }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground",
              onNavigate && "w-full",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
