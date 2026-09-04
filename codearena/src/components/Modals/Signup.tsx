"use client";

import React, { useState, useEffect } from "react";
import { auth } from "@/firebase/firebase";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { useSetRecoilState } from "recoil";
import { authModalState } from "@/atoms/authModalAtom";
import { toast } from "react-toastify";

const Signup: React.FC = () => {
	const setAuthModalState = useSetRecoilState(authModalState);

	const [displayName, setDisplayName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const [
		createUserWithEmailAndPassword,
		user,
		loading,
		error,
	] = useCreateUserWithEmailAndPassword(auth);

	const handleLogin = () => {
		setAuthModalState((prev) => ({
			...prev,
			type: "login",
		}));
	};

	const handleRegister = async (
		e: React.FormEvent<HTMLFormElement>
	) => {
		e.preventDefault();

		if (!email || !password || !displayName) {
			toast.error("Please fill all fields", {
				position: "top-center",
				autoClose: 3000,
				theme: "dark",
			});
			return;
		}

		if (password.length < 6) {
			toast.error("Password must be at least 6 characters", {
				position: "top-center",
				autoClose: 3000,
				theme: "dark",
			});
			return;
		}

		await createUserWithEmailAndPassword(email, password);
	};

	useEffect(() => {
		if (user) {
			localStorage.setItem(
				"codearenaDisplayName",
				displayName
			);

			localStorage.setItem("codearenaEmail", email);
			localStorage.setItem("codearenaLoggedIn", "true");

			toast.success("Account created successfully!", {
				position: "top-center",
				autoClose: 3000,
				theme: "dark",
			});

			setAuthModalState((prev) => ({
				...prev,
				isLoggedIn: true,
				isOpen: false,
				type: "login",
			}));
		}
	}, [user, displayName, email, setAuthModalState]);

	useEffect(() => {
		if (error) {
			toast.error(error.message, {
				position: "top-center",
				autoClose: 4000,
				theme: "dark",
			});
		}
	}, [error]);

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
					value={email}
					onChange={(e) => setEmail(e.target.value)}
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
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="border-2 outline-none sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
					placeholder="*******"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-brand-orange hover:bg-brand-orange-s disabled:opacity-50"
			>
				{loading ? "Creating Account..." : "Register"}
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