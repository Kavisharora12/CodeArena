import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import Providers from "./Providers";

export const metadata: Metadata = {
  title: "CodeArena",
  icons: {
    icon: "/favicon.ico",
  },
  description:
    "Web application that contains CodeArena problems and video solutions",
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
      </body>
    </html>
  );
}
