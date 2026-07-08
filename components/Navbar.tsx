"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const navLinks = [
  { href: "/home", label: "Home" },
  { href: "/blocks", label: "Blocks" },
  { href: "/exam", label: "Exam" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-cyan-400/20 bg-[var(--bg-page)]/70 backdrop-blur-xl overflow-x-hidden">
      <div className="mx-auto mt-2 flex max-w-4xl items-center justify-between rounded-xl border border-cyan-300/20 bg-[var(--bg-nav-inner)]/60 p-2 md:px-6 md:py-3">
        <Link href="/home" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 sm:size-6 text-[var(--accent-cyan)] shrink-0">
            <path d="M11.584 2.376a.75.75 0 0 1 .832 0l9 6a.75.75 0 1 1-.832 1.248L12 3.901 3.416 9.624a.75.75 0 0 1-.832-1.248l9-6Z" />
            <path fillRule="evenodd" d="M20.25 10.332v9.918H21a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1 0-1.5h.75v-9.918a.75.75 0 0 1 .634-.74A49.109 49.109 0 0 1 12 9c2.59 0 5.134.202 7.616.592a.75.75 0 0 1 .634.74Zm-7.5 2.418a.75.75 0 0 0-1.5 0v6.75a.75.75 0 0 0 1.5 0v-6.75Zm3-.75a.75.75 0 0 1 .75.75v6.75a.75.75 0 0 1-1.5 0v-6.75a.75.75 0 0 1 .75-.75ZM9 12.75a.75.75 0 0 0-1.5 0v6.75a.75.75 0 0 0 1.5 0v-6.75Z" clipRule="evenodd" />
            <path d="M12 7.875a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" />
          </svg>
          <span className="text-sm sm:text-lg font-semibold tracking-wide text-[var(--text-body)]">DiagKnow</span>
        </Link>
        <div className="flex items-center gap-0.5 sm:gap-2">
          <ul className="flex gap-0.5 sm:gap-4">
            {navLinks.map(({ href, label }) => {
              const isActive =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`rounded-md px-1.5 py-1 text-xs sm:px-3 sm:py-2 sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? "border border-cyan-300/40 border-b-[3px] border-b-[var(--accent-cyan-strong)] bg-cyan-400/10 text-[var(--accent-cyan-strong)] shadow-[0_0_18px_rgba(0,224,255,0.2)]"
                        : "text-[var(--text-muted-light)] hover:bg-cyan-400/8 hover:text-[var(--accent-cyan-strong)] active:bg-cyan-400/8 active:text-[var(--accent-cyan-strong)]"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
