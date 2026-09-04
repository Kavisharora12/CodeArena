import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import Providers from "./Providers";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const metadata: Metadata = {
	title: "CodeArena",
	description:
		"Web application that contains CodeArena problems and video solutions",
	icons: {
		icon: "/icon.png",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="h-full antialiased">
			<body className="min-h-full flex flex-col">
				<Providers>{children}</Providers>

				<ToastContainer />
			</body>
		</html>
	);
}