"use client";

import React, { useState } from "react";
import { IoClose } from "react-icons/io5";

import Login from "./Login";
import Signup from "./Signup";
import ResetPassword from "./ResetPassword";

const AuthModal: React.FC = () => {
  const [type, setType] = useState<
    "login" | "register" | "forgotPassword"
  >("login");

  const [isOpen, setIsOpen] = useState(true);

  const closeModal = () => {
    setIsOpen(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Background */}
      <div
        className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-60"
        onClick={closeModal}
      ></div>

      {/* Modal */}
      <div className="w-full sm:w-[450px] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] flex justify-center items-center">
        <div className="relative w-full h-full mx-auto flex items-center justify-center">
          <div className="bg-white rounded-lg shadow relative w-full bg-gradient-to-b from-brand-orange to-slate-900 mx-6">
            
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
            {type === "login" && (
              <Login onRegister={() => setType("register")} />
            )}

            {/* Signup */}
            {type === "register" && (
              <Signup onLogin={() => setType("login")} />
            )}

            {/* Reset Password */}
            {type === "forgotPassword" && <ResetPassword />}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;