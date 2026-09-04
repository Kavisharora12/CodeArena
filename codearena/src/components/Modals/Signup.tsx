"use client";

import React, { useState } from "react";
import { useSetRecoilState } from "recoil";
import { authModalState } from "@/atoms/authModalAtom";

const Signup: React.FC = () => {
	const setAuthModalState = useSetRecoilState(authModalState);
	const [displayName, setDisplayName] = useState("");

	const handleLogin = () => {
		setAuthModalState((prev) => ({
			...prev,
			type: "login",
		}));
	};
const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
	e.preventDefault();

	handleLogin();
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
					type="text"
					name="displayName"
					id="displayName"
					value={displayName}
					onChange={(e) => setDisplayName(e.target.value)}
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
				Register
			</button>

			<div className="text-sm font-medium text-gray-300">
				Already have an account?{" "}
				<button
					type="button"
					onClick={handleLogin}
					className="text-brand-orange hover:underline"
				>
					Log In
				</button>
			</div>
		</form>
	);
};

export default Signup;