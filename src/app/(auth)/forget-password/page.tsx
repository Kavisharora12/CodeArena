"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { emailValidation } from "@/schemas/forgetPasswordSchema";
import { firebaseAuth } from "@/lib/firebase";

export default function ForgotPasswordPage() {
  const [isSending, setIsSending] = useState(false);
  const form = useForm<z.infer<typeof emailValidation>>({
    resolver: zodResolver(emailValidation),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }: z.infer<typeof emailValidation>) => {
    setIsSending(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      toast.success("If an account exists for that email, a reset link has been sent.");
      form.reset();
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "auth/invalid-email"
      ) {
        toast.error("Enter a valid email address.");
      } else {
        console.error("Firebase password reset request failed:", error);
        toast.error("Unable to send a password reset email. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  };

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
        <h1 className="mt-8 text-3xl font-semibold">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll email you a secure link to choose a new password.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSending}>
              {isSending && <Loader2 className="size-5 animate-spin" />}
              Send reset link
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/sign-in" className="font-semibold text-foreground underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
