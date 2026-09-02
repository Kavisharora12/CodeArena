"use client";

import React from "react";
import { useRecoilState } from "recoil";
import { authModalState } from "@/atoms/authModalAtom";
import AuthModal from "@/components/Modals/AuthModal";

const AuthPage = () => {
  const [authModal, setAuthModalState] =
    useRecoilState(authModalState);

  const handleSignIn = () => {
    setAuthModalState((prev) => ({
      ...prev,
      isOpen: true,
      type: "login",
    }));
  };

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

      {/* Hero */}
      <div className="flex items-center justify-center mt-20">
        <img
          src="/hero.png"
          alt="CodeArena"
          className="max-w-full h-auto"
        />
      </div>

      {/* Sign In */}
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

      {/* Modal */}
      <AuthModal />

    </div>
  );
};

export default AuthPage;