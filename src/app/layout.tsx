import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ShiftProvider } from "@/context/ShiftContext";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nusantara POS",
  description: "Point of Sale Modern by Nusantara",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#f8f9fa] text-zinc-900">
        <ShiftProvider>
          {children}
        </ShiftProvider>
      </body>
    </html>
  );
}
