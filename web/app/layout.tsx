import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { Header } from "./components/Header";

export const metadata: Metadata = {
  title: "soul.md — Your identity, not theirs.",
  description: "An open format for your AI identity — values, voice, skills, taste. Manoma is the MCP server that makes any LLM read it. User-owned, git-versioned, vendor-neutral.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <div className="min-h-screen bg-bg text-fg">
          <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col bg-surface">
            <Header />
            <main className="flex flex-1 flex-col px-6 pt-16 pb-24 sm:px-10 sm:pt-20 sm:pb-32 bg-surface">
              {children}
            </main>
          </div>
        </div>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
