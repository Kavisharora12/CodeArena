"use client";

import React, { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import { authModalState } from "@/atoms/authModalAtom";
import { auth } from "@/firebase/firebase";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";

const Login: React.FC = () => {
  const setAuthModalState = useSetRecoilState(authModalState);
  const router = useRouter();

  const [inputs, setInputs] = useState({
    email: "",
    password: "",
  });

  const [
    signInWithEmailAndPassword,
    user,
    loading,
    error,
  ] = useSignInWithEmailAndPassword(auth);

  const handleClick = (
    type: "login" | "register" | "forgotPassword"
  ) => {
    setAuthModalState((prev) => ({
      ...prev,
      type,
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setInputs((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!inputs.email || !inputs.password) {
      alert("Please fill all fields");
      return;
    }

    try {
      const newUser = await signInWithEmailAndPassword(
        inputs.email,
        inputs.password
      );

      if (!newUser) return;

      router.push("/");
    } catch (error: any) {
      alert(error.message);
    }
  };

  useEffect(() => {
    if (error) {
      alert(error.message);
    }
  }, [error]);

  return (
    <form
      className="space-y-6 px-6 pb-4"
      onSubmit={handleLogin}
    >
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
          onChange={handleInputChange}
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
          onChange={handleInputChange}
          type="password"
          name="password"
          id="password"
          className="border-2 outline-none sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
          placeholder="*******"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-brand-orange hover:bg-brand-orange-s disabled:opacity-50"
      >
        {loading ? "Loading..." : "Log In"}
      </button>

      <button
        type="button"
        onClick={() => handleClick("forgotPassword")}
        className="flex w-full justify-end text-sm text-brand-orange hover:underline"
      >
        Forgot Password?
      </button>

      <div className="text-sm font-medium text-gray-300">
        Not Registered?{" "}
        <button
          type="button"
          onClick={() => handleClick("register")}
          className="text-brand-orange hover:underline"
        >
          Create account
        </button>
      </div>
    </form>
  );
};

export default Login;