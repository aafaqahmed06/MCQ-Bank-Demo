"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/home", label: "Home" },
  { href: "/blocks", label: "Blocks" },
  { href: "/exam", label: "Exam" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-cyan-400/20 bg-[#0b0f1a]/70 backdrop-blur-xl">
      <div className="mx-auto mt-2 flex max-w-4xl items-center justify-between rounded-xl border border-cyan-300/20 bg-[#0f1528]/60 p-3 md:px-6 md:py-3">
        <Link href="/home" className="text-lg font-semibold tracking-wide text-[#e6f6ff]">
          DiagKnow
        </Link>
        <ul className="flex gap-1 sm:gap-4">
          {navLinks.map(({ href, label }) => {
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`rounded-md px-3 py-2 text-sm font-medium sm:px-4 sm:py-2.5 transition-colors ${
                    isActive
                      ? "border border-cyan-300/40 bg-cyan-400/10 text-cyan-200 shadow-[0_0_18px_rgba(0,224,255,0.2)]"
                      : "text-[#9db1ce] hover:bg-cyan-400/8 hover:text-cyan-200 active:bg-cyan-400/8 active:text-cyan-200"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
