"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useSession } from "@/context/AuthProvider";
import { signOut as signOutFirebase } from "firebase/auth";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import NavDropdown from "./NavDropdown";
import NavLinks from "./NavLinks";
import NavRunButtonsContainer from "./NavRunButtonsContainer";
import { Button } from "./ui/button";
import { firebaseAuth } from "@/lib/firebase";

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useTheme();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isProblemWorkspace = pathname.startsWith("/problem/");

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/session", { method: "DELETE" });
      if (!response.ok) {
        toast.error("Unable to end your CodeArena session. Please retry.");
        return;
      }
      await signOutFirebase(firebaseAuth);
      router.replace("/sign-in");
    } catch {
      toast.error("Unable to sign out. Please check your connection and retry.");
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (!mounted) {
    return null;
  }

  return (
    <header className="relative z-30 w-full border-b bg-background">
      <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center justify-between gap-2 px-2 py-1 sm:min-h-16 sm:gap-4 sm:px-6 sm:py-0">
        <Link
          href="/"
          aria-label="CodeArena home"
          className="flex shrink-0 items-center rounded-md bg-black px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img
            src="/codearena-wordmark.png"
            alt="CodeArena — Compete. Code. Conquer."
            className="h-8 w-32 object-contain sm:h-10 sm:w-40"
          />
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
          {isProblemWorkspace ? (
            <NavRunButtonsContainer session={session} />
          ) : (
            <NavLinks
              session={session}
              pathname={pathname}
              className="justify-center"
            />
          )}
        </div>

        <div className="flex max-w-full shrink-0 items-center gap-2">
          {status !== "loading" && !session && (
            <div className="hidden items-center gap-2 lg:flex">
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button
                asChild
                className="bg-primary text-primary-foreground hover:bg-primary-hover"
              >
                <Link href="/sign-up">Create account</Link>
              </Button>
            </div>
          )}
          {session && (
            <NavDropdown session={session} signOut={handleSignOut} theme={theme} />
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="border-t bg-background px-4 py-4 sm:px-6 lg:hidden"
        >
          <NavLinks
            session={session}
            pathname={pathname}
            onNavigate={() => setMobileMenuOpen(false)}
          />
          {status !== "loading" && !session && (
            <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4">
              <Button variant="outline" asChild>
                <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                  Sign in
                </Link>
              </Button>
              <Button
                asChild
                className="bg-primary text-primary-foreground hover:bg-primary-hover"
              >
                <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                  Create account
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
