import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TripKarLo",
  description: "Ride Together, Explore Further with the ultimate group riding platform.",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "TripKarLo",
    description: "Ride Together, Explore Further with the ultimate group riding platform.",
    images: [
      {
        url: "/og-image.png",
        width: 1024,
        height: 1024,
        alt: "TripKarLo Logo",
      },
    ],
  },
};

import { Providers } from "@/components/providers";
import Navbar from "@/components/navbar";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Suspense fallback={<div className="h-16 bg-zinc-950 border-b border-zinc-800 antialiased animate-pulse" />}>
            <Navbar />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
