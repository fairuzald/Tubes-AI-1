import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { PropsWithChildren } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Font configuration
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

// Metadata configuration
export const metadata: Metadata = {
  title: {
    default: "Diagonal Magic Cube Solver",
    template: "%s | Diagonal Magic Cube Solver",
  },
  description:
    "An advanced local search algorithm implementation for solving diagonal magic cube puzzles with various optimization techniques including random restart hill climbing.",
  keywords: [
    "diagonal magic cube",
    "local search algorithm",
    "optimization",
    "hill climbing",
    "puzzle solver",
    "magic cube solver",
    "random restart",
    "mathematical optimization",
  ],
  creator: "Local Search Algorithm Lab",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
  },
  openGraph: {
    type: "website",
    title: "Diagonal Magic Cube Solver",
    description:
      "Solve diagonal magic cube puzzles using advanced local search algorithms and optimization techniques.",
    siteName: "Diagonal Magic Cube Solver",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Diagonal Magic Cube Solver Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Diagonal Magic Cube Solver",
    description:
      "Advanced local search algorithm for diagonal magic cube optimization",
    images: ["/logo.png"],
    creator: "@magiccubesolver",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "Mathematical Optimization Tools",
};

// Viewport configuration
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className={poppins.className} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" type="image/png" />
      </head>
      <body className={`antialiased font-poppins bg-background min-h-screen`}>
        {" "}
        <Toaster />
        <div className="relative flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
