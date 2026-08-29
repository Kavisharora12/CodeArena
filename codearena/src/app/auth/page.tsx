"use client";

import { authModalState } from "@/atoms/authModalAtom";
import AuthModal from "@/components/Modals/AuthModal";
import React from "react";
import { useRecoilValue } from "recoil";

const AuthPage = () => {
  const authModal = useRecoilValue(authModalState);

  return (
    <div className="bg-gradient-to-b from-gray-600 to-black min-h-screen relative">
      <div className="max-w-7xl mx-auto">
        {authModal.isOpen && <AuthModal />}
      </div>
    </div>
  );
};

export default AuthPage;