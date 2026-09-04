"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSetRecoilState } from "recoil";
import { authModalState } from "@/atoms/authModalAtom";

const Login: React.FC = () => {
	const router = useRouter();
	const setAuthModalState = useSetRecoilState(authModalState);

	const handleClick = (
		type: "login" | "register" | "forgotPassword"
	) => {
		setAuthModalState((prev) => ({
			...prev,
			type,
		}));
	};
	const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);
		const email = formData.get("email") as string;

		localStorage.setItem("codearenaEmail", email);
		localStorage.setItem("codearenaLoggedIn", "true");

		setAuthModalState((prev) => ({
			...prev,
			isLoggedIn: true,
			isOpen: false,
		}));

		router.push("/");
	};

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