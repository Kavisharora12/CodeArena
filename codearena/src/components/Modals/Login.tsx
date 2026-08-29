"use client";

import React from "react";

type LoginProps = {
  onRegister: () => void;
};

const Login: React.FC<LoginProps> = ({ onRegister }) => {
  return (
    <form className="space-y-6 px-6 pb-4">
      <h3 className="text-xl font-medium text-white">
        Sign in to CodeArena
      </h3>

      <div>
        <label
          htmlFor="email"
          className="text-sm font-medium block mb-2 text-gray-300"
        >
          Your Email
        </label>

        <input
          type="email"
          name="email"
          id="email"
          className="border-2 outline-none sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
          placeholder="name@company.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="text-sm font-medium block mb-2 text-gray-300"
        >
          Your Password
        </label>

        <input
          type="password"
          name="password"
          id="password"
          className="border-2 outline-none sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
          placeholder="*******"
        />
      </div>

      <button
        type="submit"
        className="w-full text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-brand-orange hover:bg-brand-orange-s"
      >
        Log In
      </button>

      <div className="text-sm font-medium text-gray-300">
        Not Registered?{" "}
        <button
          type="button"
          onClick={onRegister}
          className="text-brand-orange hover:underline"
        >
          Create account
        </button>
      </div>
    </form>
  );
};

export default Login;