"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendEmailVerification } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { firebaseAuth } from "@/lib/firebase";

export default function VerifyAccountPage() {
  const [mounted, setMounted] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const checkVerification = async () => {
    const user = firebaseAuth.currentUser;
    if (!user) {
      toast.error("Sign in to the account you just created, then check verification.");
      return;
    }

    setIsChecking(true);
    try {
      await user.reload();
      if (firebaseAuth.currentUser?.emailVerified) {
        toast.success("Email verified. You can sign in now.");
        await firebaseAuth.signOut();
        router.replace("/sign-in");
      } else {
        toast.error("Your email is not verified yet. Check your inbox.");
      }
    } catch {
      toast.error("Unable to check verification. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const resendVerification = async () => {
    const user = firebaseAuth.currentUser;
    if (!user) {
      toast.error("Your signup session is unavailable. Please sign up again.");
      return;
    }

    setIsResending(true);
    try {
      await sendEmailVerification(user);
      toast.success("Verification email sent.");
    } catch {
      toast.error("Unable to send verification email. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  if (!mounted) return null;

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border bg-card p-8">
        <div className="mx-auto w-fit rounded-md bg-black px-2 py-1">
          <img
            src="/codearena-wordmark.png"
            alt="CodeArena — Compete. Code. Conquer."
            className="h-16 w-64 object-contain"
          />
        </div>
        <h1 className="mt-8 text-3xl font-semibold">Verify your email</h1>
        <p className="mt-3 text-muted-foreground">
          Follow the verification link sent by Firebase, then return here to
          confirm your account.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button onClick={checkVerification} disabled={isChecking}>
            {isChecking && <Loader2 className="size-5 animate-spin" />}
            I&apos;ve verified my email
          </Button>
          <Button
            variant="outline"
            onClick={resendVerification}
            disabled={isResending}
          >
            {isResending && <Loader2 className="size-5 animate-spin" />}
            Resend verification email
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Need to start over?{" "}
          <Link href="/sign-up" className="font-semibold text-foreground underline">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
