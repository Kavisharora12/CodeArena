"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { authModalState } from "@/atoms/authModalAtom";
import Logout from "../Buttons/Logout";
import Timer from "../Timer/Timer";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { BsList } from "react-icons/bs";

type TopbarProps = {
	problemPage?: boolean;
};

export default function Topbar({
	problemPage,
}: TopbarProps) {
	const authModal = useRecoilValue(authModalState);
	const setAuthModalState = useSetRecoilState(authModalState);

	const [mounted, setMounted] = useState(false);
	const [email, setEmail] = useState("");

	useEffect(() => {
		setMounted(true);

		const loggedIn =
			localStorage.getItem("codearenaLoggedIn") === "true";

		const savedEmail =
			localStorage.getItem("codearenaEmail");

		if (savedEmail) {
			setEmail(savedEmail);
		}

		if (loggedIn) {
			setAuthModalState((prev) => ({
				...prev,
				isLoggedIn: true,
			}));
		}
	}, [setAuthModalState]);

	if (!mounted) return null;

	return (
		<nav className="relative flex h-[50px] w-full shrink-0 items-center px-5 bg-dark-layer-1 text-dark-gray-7">
			<div className="flex w-full max-w-[1200px] mx-auto items-center">

				{/* Logo */}
				<Link
					href="/"
					className="h-[30px] flex items-center"
				>
					<Image
						src="/logo.png"
						alt="CodeArena"
						height={100}
						width={100}
					/>
				</Link>

				{/* Problem Page Navigation */}
				{problemPage && (
					<div className="flex items-center gap-4 ml-auto mr-8">

						<button
							type="button"
							className="flex items-center justify-center rounded bg-dark-layer-1 hover:bg-gray-700 h-8 w-8 cursor-pointer text-white"
						>
							<FaChevronLeft />
						</button>

						<Link
							href="/"
							className="flex items-center gap-2 font-medium text-gray-300"
						>
							<BsList />
							<span>Problem List</span>
						</Link>

						<button
							type="button"
							className="flex items-center justify-center rounded bg-dark-layer-1 hover:bg-gray-700 h-8 w-8 cursor-pointer text-white"
						>
							<FaChevronRight />
						</button>

					</div>
				)}

				{/* Right Side */}
				<div className="flex items-center space-x-4 ml-auto">

					{/* Timer - only on problem page */}
					{authModal.isLoggedIn && problemPage && (
						<Timer />
					)}

					{/* Sign In */}
					{!authModal.isLoggedIn && (
						<Link
							href="/auth"
							className="bg-brand-orange text-white px-3 py-1.5 rounded-md text-sm font-medium"
						>
							Sign In
						</Link>
					)}

					{/* Avatar */}
					{authModal.isLoggedIn && (
						<div className="cursor-pointer group relative">
							<Image
								src="/avatar.png"
								alt="Avatar"
								width={32}
								height={32}
								className="rounded-full"
							/>

							{/* Email Tooltip */}
							<div
								className="
									absolute top-10 right-0
									bg-dark-layer-1
									text-brand-orange
									p-2 rounded shadow-lg
									z-40
									group-hover:scale-100
									scale-0
									transition-all duration-300
									whitespace-nowrap
								"
							>
								<p className="text-sm">
									{email}
								</p>
							</div>
						</div>
					)}

					{/* Logout */}
					{authModal.isLoggedIn && <Logout />}

				</div>
			</div>
		</nav>
	);
}