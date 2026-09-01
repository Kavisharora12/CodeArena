"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSetRecoilState } from "recoil";
import { authModalState } from "@/atoms/authModalAtom";

export default function Topbar() {
  const router = useRouter();
  const setAuthModalState = useSetRecoilState(authModalState);

  const handleSignIn = () => {
    setAuthModalState((prev) => ({
      ...prev,
      isOpen: true,
      type: "login",
    }));
    router.push("/auth");
  };

  return (
    <div className="flex items-center justify-between sm:px-12 px-2 md:px-24">
      <Link href="/" className="flex items-center justify-center h-20">
        <Image
          src="/logo.png"
          alt="CodeArena"
          height={200}
          width={200}
        />
      </Link>

      <div className="flex items-center">
        <button
          type="button"
          onClick={handleSignIn}
          className="bg-brand-orange text-white px-2 py-1 sm:px-4 rounded-md text-sm font-medium
          hover:text-brand-orange hover:bg-white hover:border-2 hover:border-brand-orange border-2 border-transparent
          transition duration-300 ease-in-out"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}