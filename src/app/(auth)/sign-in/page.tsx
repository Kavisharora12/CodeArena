"use client";

import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeClosed, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useTheme } from 'next-themes';
import { signInValidation } from '@/schemas/signInSchema';
import { useSession } from "@/context/AuthProvider";
import { sendEmailVerification, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase';


export default function SignInPage() {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isShowingPassword, setIsShowingPassword] = useState<boolean>(false);
  const router = useRouter();
  const { theme, systemTheme, setTheme } = useTheme();
  const { refreshSession } = useSession();

  // zod validation + react hook form
  const form = useForm<z.infer<typeof signInValidation>>({
    resolver: zodResolver(signInValidation),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data: z.infer<typeof signInValidation>) => {
    setIsSubmitting(true);
    try {
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        data.email,
        data.password,
      );

      if (!credential.user.emailVerified) {
        try {
          await sendEmailVerification(credential.user);
        } catch (error) {
          await firebaseSignOut(firebaseAuth);
          if (
            error &&
            typeof error === "object" &&
            "code" in error &&
            typeof error.code === "string" &&
            error.code === "auth/too-many-requests"
          ) {
            toast.error("Too many verification emails were requested. Try again later.");
          } else {
            toast.error("Your email is not verified, and we couldn't send a verification email. Try again later.");
          }
          return;
        }
        await firebaseSignOut(firebaseAuth);
        toast.success("Verification email sent. Check your inbox and spam folder, then sign in again.");
        return;
      }

      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        await firebaseSignOut(firebaseAuth);
        toast.error(
          result?.message ?? "Unable to create a CodeArena session.",
        );
        return;
      }

      await refreshSession();
      toast.success("Signed in successfully.");
      router.replace('/problems');
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        typeof error.code === "string"
      ) {
        const firebaseErrorMessages: Record<string, string> = {
          "auth/invalid-credential": "Email or password is incorrect.",
          "auth/user-disabled": "This account has been disabled.",
          "auth/too-many-requests": "Too many attempts. Try again later.",
        };
        toast.error(firebaseErrorMessages[error.code] ?? "Sign in failed.");
      } else {
        toast.error("Something went wrong. Please try again.");
        console.error("Sign in error:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!mounted) return;
    if (theme && systemTheme) {
      setTheme(systemTheme);
    }
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePasswordShow = () => {
    setIsShowingPassword(!isShowingPassword);
  }

  // this line help us to avoid theme hydration error
  if (!mounted) {
    return null;
  }

  return (
    <div className='w-full h-[calc(100vh-4rem)] flex justify-center items-center'>
      <div className="w-[32rem] border-2 py-4 px-8 rounded-2xl flex flex-col items-center relative">
        <div className="logo rounded-md bg-black px-2 py-1">
          <img src="/codearena-wordmark.png" alt="CodeArena — Compete. Code. Conquer." className="h-16 w-64 object-contain" />
        </div>
        <div className="w-full">
          <h1 className='text-3xl mt-8 mb-2 font-semibold'>Sign in</h1>
          <p className="text-sm w-[90%]">Welcome back! Continue solving challenges and track your coding progress.</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full mt-8">
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" {...field} className='text-base p-4 h-11' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem className='mb-3'>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative w-auto h-auto">
                      <Input type={isShowingPassword ? 'text' : 'password'} placeholder="Password" {...field} className='text-base p-4 h-11' />
                      {isShowingPassword ? <Eye onClick={handlePasswordShow} className={`absolute right-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer ${theme === "dark" ? 'text-neutral-400' : ''}`} /> : <EyeClosed onClick={handlePasswordShow} className={`absolute right-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer ${theme === "dark" ? 'text-neutral-400' : ''}`} />}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="w-full flex gap-2 items-center">
              <p>Forget password?</p>
              <Link href="/forget-password" className='font-semibold' >Click here</Link>
            </div>
            <Button type="submit" className='w-full h-11 text-base font-semibold cursor-pointer'>{isSubmitting ? <><Loader2 className='resize-custom animate-spin w-7 h-7' /> Please wait</> : 'Sign in'}</Button>
          </form>
        </Form>
        <div className="w-full flex gap-2 items-center my-4">
          <p>Don&apos;t have an account?</p>
          <Link href="/sign-up" className='font-semibold' >Sign up</Link>
        </div>
      </div>
    </div>
  )
}
