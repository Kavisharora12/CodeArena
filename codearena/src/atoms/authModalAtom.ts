import { atom } from "recoil";

type AuthModalState = {
	isOpen: boolean;
	type: "login" | "register" | "forgotPassword";
	isLoggedIn: boolean;
};

export const authModalState = atom<AuthModalState>({
	key: "authModalState",
	default: {
		isOpen: false,
		type: "login",
		isLoggedIn: false,
	},
});