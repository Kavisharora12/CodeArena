import { atom } from "recoil";

type AuthModalState = {
  isOpen: boolean;
  type: "login" | "register" | "forgotPassword";
};

export const authModalState = atom<AuthModalState>({
  key: "authModalState",
  default: {
    isOpen: true,
    type: "login",
  },
});