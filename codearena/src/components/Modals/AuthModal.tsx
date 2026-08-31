"use client";

import React, { useState } from "react";
import { IoClose } from "react-icons/io5";

import Login from "./Login";
import Signup from "./Signup";
import ResetPassword from "./ResetPassword";

type AuthModalProps = {
  onClose: () => void;
};

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [type, setType] = useState<
    "login" | "register" | "forgotPassword"
  >("login");

  return (
    <>
      {/* Background Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
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
                onClick={onClose}
              >
                <IoClose className="h-5 w-5" />
              </button>
            </div>

            {/* Login */}
            {type === "login" && (
              <Login
                onRegister={() => setType("register")}
                onForgotPassword={() => setType("forgotPassword")}
              />
            )}

            {/* Register */}
            {type === "register" && (
              <Signup
                onLogin={() => setType("login")}
              />
            )}

            {/* Reset Password */}
            {type === "forgotPassword" && (
              <ResetPassword
                onLogin={() => setType("login")}
              />
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;