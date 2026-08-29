import Image from "next/image";
import Topbar from "@/components/Topbar/Topbar";
import AuthModal from "@/components/Modals/AuthModal";

export default function Auth() {
  return (
    <div className="bg-gradient-to-b from-gray-600 to-black min-h-screen relative">
      <Topbar />

      <div className="flex items-center justify-center h-[calc(100vh-80px)] pointer-events-none select-none">
        <Image
          src="/hero.png"
          alt="CodeArena"
          width={600}
          height={600}
          className="object-contain"
        />
      </div>

      <AuthModal />
    </div>
  );
}