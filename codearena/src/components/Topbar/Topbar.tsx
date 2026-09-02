"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { authModalState } from "@/atoms/authModalAtom";
import Logout from "../Buttons/Logout";

export default function Topbar() {
	const authModal = useRecoilValue(authModalState);
	const setAuthModalState = useSetRecoilState(authModalState);

	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);

		const loggedIn =
			localStorage.getItem("codearenaLoggedIn") === "true";

		if (loggedIn) {
			setAuthModalState((prev) => ({
				...prev,
				isLoggedIn: true,
			}));
		}
	}, [setAuthModalState]);

	if (!mounted) {
		return null;
	}

	return (
		<nav className="relative flex h-[50px] w-full shrink-0 items-center px-5 bg-dark-layer-1 text-dark-gray-7">
			<div className="flex w-full max-w-[1200px] mx-auto items-center justify-between">

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

				{/* Right Side */}
				<div className="flex items-center space-x-4">

					{/* Premium */}
					<a
						href="#"
						className="bg-dark-fill-3 py-1.5 px-3 cursor-pointer rounded text-brand-orange hover:bg-dark-fill-2"
					>
						Premium
					</a>

					{/* Sign In */}
					{!authModal.isLoggedIn && (
						<Link
							href="/auth"
							className="bg-dark-fill-3 py-1 px-2 cursor-pointer rounded text-white hover:bg-dark-fill-2"
						>
							Sign In
						</Link>
					)}

					{/* Avatar + Logout */}
					{authModal.isLoggedIn && (
						<>
							<div className="cursor-pointer group relative">
								<Image
									src="/avatar.png"
									alt="Avatar"
									width={32}
									height={32}
									className="rounded-full"
								/>

								<div
									className="
										absolute top-10 left-1/2 -translate-x-1/2
										bg-dark-layer-1 text-brand-orange
										p-2 rounded shadow-lg z-40
										group-hover:scale-100 scale-0
										transition-all duration-300
										whitespace-nowrap
									"
								>
									<p className="text-sm">
										user@example.com
									</p>
								</div>
							</div>

							<Logout />
						</>
					)}
				</div>
			</div>
		</nav>
	);
}