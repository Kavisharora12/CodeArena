"use client";

import React, { useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { useRecoilValue, useSetRecoilState } from "recoil";

import { authModalState } from "@/atoms/authModalAtom";
import Login from "./Login";
import Signup from "./Signup";
import ResetPassword from "./ResetPassword";

const AuthModal: React.FC = () => {
  const authModal = useRecoilValue(authModalState);
  const setAuthModalState = useSetRecoilState(authModalState);

  const closeModal = () => {
    setAuthModalState((prev) => ({
      ...prev,
      isOpen: false,
      type: "login",
    }));
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  if (!authModal.isOpen) {
    return null;
  }

  return (
    <>
      {/* Background Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={closeModal}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="w-full sm:w-[450px] relative mx-6">
          <div className="rounded-lg shadow w-full bg-gradient-to-b from-brand-orange to-slate-900">

            {/* Close Button */}
            <div className="flex justify-end p-2">
              <button
                type="button"
                className="bg-transparent rounded-lg text-sm p-1.5 ml-auto inline-flex items-center hover:bg-gray-800 hover:text-white text-white"
                onClick={closeModal}
              >
                <IoClose className="h-5 w-5" />
              </button>
            </div>

            {/* Login */}
            {authModal.type === "login" && <Login />}

            {/* Register */}
            {authModal.type === "register" && <Signup />}

            {/* Reset Password */}
            {authModal.type === "forgotPassword" && (
              <ResetPassword />
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;