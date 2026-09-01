"use client";

import React, { useState } from "react";
import { authModalState } from "@/atoms/authModalAtom";
import { auth, firestore } from "@/firebase/firebase";
import { useSetRecoilState } from "recoil";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";

const Signup: React.FC = () => {
  const setAuthModalState = useSetRecoilState(authModalState);

  const [inputs, setInputs] = useState({
    email: "",
    displayName: "",
    password: "",
  });

  const router = useRouter();

  const [
    createUserWithEmailAndPassword,
    user,
    loading,
    error,
  ] = useCreateUserWithEmailAndPassword(auth);

  const handleClick = () => {
    setAuthModalState((prev) => ({
      ...prev,
      type: "login",
    }));
  };

  const handleChangeInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setInputs((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    console.log(inputs);

    if (!inputs.email || !inputs.password || !inputs.displayName) {
      alert("Please fill all fields");
      return;
    }

    try {
      const newUser = await createUserWithEmailAndPassword(
        inputs.email,
        inputs.password
      );

      if (!newUser) return;

      const userData = {
        uid: newUser.user.uid,
        email: newUser.user.email,
        displayName: inputs.displayName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        likedProblems: [],
        dislikedProblems: [],
        solvedProblems: [],
        starredProblems: [],
      };

      await setDoc(
        doc(firestore, "users", newUser.user.uid),
        userData
      );

      router.push("/");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <form
      className="space-y-6 px-6 pb-4"
      onSubmit={handleRegister}
    >
      <h3 className="text-xl font-medium text-white">
        Register to CodeArena
      </h3>

      <div>
        <label
          htmlFor="email"
          className="text-sm font-medium block mb-2 text-gray-300"
        >
          Email
        </label>

        <input
          onChange={handleChangeInput}
          type="email"
          name="email"
          id="email"
          className="border-2 outline-none sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
          placeholder="name@company.com"
        />
      </div>

      <div>
        <label
          htmlFor="displayName"
          className="text-sm font-medium block mb-2 text-gray-300"
        >
          Display Name
        </label>

        <input
          onChange={handleChangeInput}
          type="text"
          name="displayName"
          id="displayName"
          className="border-2 outline-none sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
          placeholder="Aayushi"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="text-sm font-medium block mb-2 text-gray-300"
        >
          Password
        </label>

        <input
          onChange={handleChangeInput}
          type="password"
          name="password"
          id="password"
          className="border-2 outline-none sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
          placeholder="*******"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">
          {error.message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-brand-orange hover:bg-brand-orange-s disabled:opacity-50"
      >
        {loading ? "Registering..." : "Register"}
      </button>

      <div className="text-sm font-medium text-gray-300">
        Already have an account?{" "}
        <button
          type="button"
          onClick={handleClick}
          className="text-brand-orange hover:underline"
        >
          Log In
        </button>
      </div>
    </form>
  );
};

export default Signup;