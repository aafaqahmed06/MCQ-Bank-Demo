"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import EasterEggTrigger from "@/components/EasterEgg";
import LogoMark from "@/components/LogoMark";
import { useAuth } from "@/components/AuthProvider";

const navLinks = [
  { href: "/home", label: "Home" },
  { href: "/blocks", label: "Blocks" },
  { href: "/exam", label: "Exam" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/account", label: "Account" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = () => {
    void signOut().then(() => {
      router.replace("/");
      router.refresh();
    });
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="border-b border-[var(--border-color)] bg-[var(--bg-nav-inner)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <EasterEggTrigger>
          <Link
            href="/home"
            className="flex items-center gap-2.5 shrink-0"
            aria-label="DiagKnow home"
          >
            <span className="text-[var(--accent-cyan)]">
              <LogoMark className="size-7 sm:size-8" />
            </span>
            <span className="text-base sm:text-lg font-semibold tracking-tight text-[var(--text-heading)]">
              DiagKnow
            </span>
          </Link>
        </EasterEggTrigger>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1">
            <ul className="flex items-center gap-1">
              {navLinks.map(({ href, label }) => {
                const isActive =
                  pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={href} className="relative">
                    <Link
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? "bg-cyan-500/12 text-[var(--accent-cyan-strong)]"
                          : "text-[var(--text-muted-light)] hover:bg-cyan-500/8 hover:text-[var(--text-heading)]"
                      }`}
                    >
                      {label}
                    </Link>
                    {isActive && (
                      <span className="absolute inset-x-3.5 -bottom-px h-0.5 rounded-full bg-[var(--accent-cyan)]" />
                    )}
                  </li>
                );
              })}
            </ul>
            <span className="mx-2 h-5 w-px bg-[var(--border-color)]" />
            <ThemeToggle />
            {user && (
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-[var(--text-muted-light)] transition-colors hover:text-[var(--error)]"
              >
                Sign out
              </button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-1.5">
            <ThemeToggle />
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-lg p-2 text-[var(--text-muted-light)] transition-colors hover:text-[var(--text-heading)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-6">
                {menuOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-[var(--border-color)] bg-[var(--bg-nav-inner)]">
          <div className="mx-auto max-w-5xl px-4 py-3">
            <ul className="flex flex-col gap-1">
              {navLinks.map(({ href, label }) => {
                const isActive =
                  pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={closeMenu}
                      aria-current={isActive ? "page" : undefined}
                      className={`block rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-cyan-500/12 text-[var(--accent-cyan-strong)]"
                          : "text-[var(--text-muted-light)] hover:bg-cyan-500/8 hover:text-[var(--text-heading)]"
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
              {user && (
                <li className="border-t border-[var(--border-color)] pt-2 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      handleSignOut();
                    }}
                    className="block w-full rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-[var(--text-muted-light)] transition-colors hover:text-[var(--error)]"
                  >
                    Sign out
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
}
