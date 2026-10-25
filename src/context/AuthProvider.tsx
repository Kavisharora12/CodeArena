"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";

import { firebaseAuth } from "@/lib/firebase";

export interface CodeArenaSession {
  user: {
    _id: string;
    uid: string;
    email: string;
    username: string;
    avatar: string;
    userType: string;
    isVerified: boolean;
  };
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  data: CodeArenaSession | null;
  status: AuthStatus;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<CodeArenaSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        cache: "no-store",
      });
      if (!response.ok) {
        setData(null);
        setStatus("unauthenticated");
        return;
      }

      const result = (await response.json()) as {
        session?: CodeArenaSession;
      };
      if (!result.session?.user?._id) {
        setData(null);
        setStatus("unauthenticated");
        return;
      }

      setData(result.session);
      setStatus("authenticated");
    } catch {
      setData(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, () => {
      void refreshSession();
    });

    return unsubscribe;
  }, [refreshSession]);

  const value = useMemo(
    () => ({ data, status, refreshSession }),
    [data, status, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSession(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useSession must be used within AuthProvider.");
  }
  return context;
}
