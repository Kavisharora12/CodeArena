"use client";

import React, { useState } from "react";
import AuthModal from "@/components/Modals/AuthModal";

const AuthPage = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

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
  {!isAuthOpen && (
  <div className="flex items-center justify-center mt-20">
    <img
      src="/hero.png"
      alt="CodeArena"
      className="max-w-full h-auto"
    />
  </div>
)}

      {/* Sign In Button */}
      {!isAuthOpen && (
        <div className="flex justify-center mt-8">
          <button
            type="button"
            onClick={() => setIsAuthOpen(true)}
            className="bg-brand-orange text-white px-6 py-3 rounded-lg"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Auth Modal */}
      {isAuthOpen && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
        />
      )}

    </div>
  );
};

export default AuthPage;