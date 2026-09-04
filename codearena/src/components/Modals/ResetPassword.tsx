"use client";

import React, { useState } from "react";
import { auth } from "@/firebase/firebase";
import { useSendPasswordResetEmail } from "react-firebase-hooks/auth";
import { useSetRecoilState } from "recoil";
import { authModalState } from "@/atoms/authModalAtom";

const ResetPassword: React.FC = () => {
	const [email, setEmail] = useState("");

	const [sendPasswordResetEmail, sending, error] =
		useSendPasswordResetEmail(auth);

	const setAuthModalState = useSetRecoilState(authModalState);

	const handleLogin = () => {
		setAuthModalState((prev) => ({
			...prev,
			isOpen: true,
			type: "login",
		}));
	};

	const handleReset = async (
		e: React.FormEvent<HTMLFormElement>
	) => {
		e.preventDefault();

		if (!email) return;

		const success = await sendPasswordResetEmail(email);

		if (success) {
			alert("Password reset email sent!");
			handleLogin();
		}
	};

	return (
		<form
			className="space-y-6 px-6 lg:px-8 pb-4 sm:pb-6"
			onSubmit={handleReset}
		>
			<h3 className="text-xl font-medium text-white">
				Reset Password
			</h3>

			<p className="text-sm text-white">
				Forgotten your password? Enter your e-mail address below,
				and we'll send you an e-mail allowing you to reset it.
			</p>

			<div>
				<label
					htmlFor="email"
					className="text-sm font-medium block mb-2 text-gray-300"
				>
					Your email
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

			{error && (
				<p className="text-red-400 text-sm">
					{error.message}
				</p>
			)}

			<button
				type="submit"
				disabled={sending}
				className="w-full text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-brand-orange hover:bg-brand-orange-s disabled:opacity-50"
			>
				{sending ? "Sending..." : "Reset Password"}
			</button>

			<div className="text-sm font-medium text-gray-300">
				Remember your password?{" "}
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

export default ResetPassword;