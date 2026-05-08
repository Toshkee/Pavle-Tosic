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
  title: "Pavle Tošić — Full-Stack Developer",
  description:
    "Full-stack developer (React, Next.js, TypeScript, Python, Django) sailing the Grand Line.",
  metadataBase: new URL("https://pavletosic.com"),
  openGraph: {
    title: "Pavle Tošić — Full-Stack Developer",
    description:
      "Full-stack developer (React, Next.js, TypeScript, Python, Django) sailing the Grand Line.",
    url: "https://pavletosic.com",
    siteName: "Pavle Tošić",
    images: [
      {
        url: "/images/me-anime.jpg",
        width: 912,
        height: 1178,
        alt: "Pavle Tošić",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pavle Tošić — Full-Stack Developer",
    description:
      "Full-stack developer (React, Next.js, TypeScript, Python, Django) sailing the Grand Line.",
    images: ["/images/me-anime.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-50`}
      >
        {children}
      </body>
    </html>
  );
}