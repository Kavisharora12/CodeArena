"use client";

import { FiLogOut } from "react-icons/fi";
import { useSetRecoilState } from "recoil";
import { authModalState } from "@/atoms/authModalAtom";

export default function Logout() {
	const setAuthModalState = useSetRecoilState(authModalState);

	const handleLogout = () => {
		localStorage.removeItem("codearenaLoggedIn");

		setAuthModalState((prev) => ({
			...prev,
			isLoggedIn: false,
		}));
	};

	return (
		<button
			type="button"
			onClick={handleLogout}
			className="flex items-center justify-center text-brand-orange hover:text-white cursor-pointer"
			title="Logout"
		>
			<FiLogOut className="w-5 h-5" />
		</button>
	);
}