"use client";

import React, { useEffect } from "react";
import { useRecoilState } from "recoil";
import { authModalState } from "@/atoms/authModalAtom";
import AuthModal from "@/components/Modals/AuthModal";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase/firebase";
import { useRouter } from "next/navigation";

const AuthPage = () => {
  const [authModal, setAuthModalState] = useRecoilState(authModalState);

  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const handleSignIn = () => {
    setAuthModalState((prev) => ({
      ...prev,
      isOpen: true,
      type: "login",
    }));
  };

  useEffect(() => {
    if (user) {
      router.push("/auth");
    }
  }, [user, router]);

  // Wait for Firebase to check authentication
  if (loading) {
    return null;
  }

  return (
    <div className="bg-gradient-to-b from-gray-600 to-black min-h-screen relative">

      {/* Logo */}
      <div className="flex justify-start pt-6 pl-8">
        <img
          src="/logo.png"
          alt="CodeArena"
          className="w-40 h-auto"
        />
      </div>

      {/* Hero - stays visible */}
      {!authModal.isOpen && (
        <div className="flex items-center justify-center mt-20">
          <img
            src="/hero.png"
            alt="CodeArena"
            className="max-w-full h-auto"
          />
        </div>
      )}

      {/* Sign In Button */}
      {!authModal.isOpen && (
        <div className="flex justify-center mt-8">
          <button
            type="button"
            onClick={handleSignIn}
            className="bg-brand-orange text-white px-6 py-3 rounded-lg"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal />

    </div>
  );
};

export default AuthPage;