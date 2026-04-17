"use client";

import Link from "next/link";
import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative">
    <header className="flex items-center justify-between px-6 py-4 sm:px-10">
      <Link
        href="/"
        className="text-base font-semibold tracking-tight text-fg"
      >
        MANØMA
      </Link>

      {/* Desktop nav */}
      <nav className="hidden items-center gap-6 text-sm sm:flex">
        <Link href="/manifesto" className="text-muted transition hover:text-fg">
          Manifesto
        </Link>
        <Link href="/docs" className="text-muted transition hover:text-fg">
          Docs
        </Link>
        <Link href="/build" className="rounded-full bg-accent px-3 py-2 text-sm font-medium text-on-accent transition hover:opacity-80">
          Build your soul
        </Link>
      </nav>

      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="flex flex-col gap-1.5 rounded p-2 text-fg sm:hidden"
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileMenuOpen}
      >
        <span className={`h-0.5 w-5 bg-current transition-transform ${mobileMenuOpen ? "translate-y-2 rotate-45" : ""}`} />
        <span className={`h-0.5 w-5 bg-current transition-opacity ${mobileMenuOpen ? "opacity-0" : ""}`} />
        <span className={`h-0.5 w-5 bg-current transition-transform ${mobileMenuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
      </button>
    </header>

    {/* Mobile nav dropdown */}
    {mobileMenuOpen && (
      <nav className="absolute left-0 right-0 top-full z-50 flex flex-col gap-1 border-b border-border bg-surface px-6 py-4 sm:hidden">
        <Link
          href="/manifesto"
          className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface-elevated hover:text-fg"
          onClick={() => setMobileMenuOpen(false)}
        >
          Manifesto
        </Link>
        <Link
          href="/docs"
          className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface-elevated hover:text-fg"
          onClick={() => setMobileMenuOpen(false)}
        >
          Docs
        </Link>
        <Link
          href="/build"
          className="mt-2 rounded-full bg-accent px-4 py-2.5 text-center text-sm font-medium text-on-accent transition hover:opacity-80"
          onClick={() => setMobileMenuOpen(false)}
        >
          Build your soul
        </Link>
      </nav>
    )}
    </div>
  );
}
