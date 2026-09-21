"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Trophy } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import ProfileMenu from "@/components/ProfileMenu";
import EasterEggTrigger from "@/components/EasterEgg";
import LogoMark from "@/components/LogoMark";
import { IconButton, cn } from "@/components/ui";

// High-frequency actions up front. Leaderboard, Theme, and Profile are
// pushed right as secondary/utility affordances (§ application shell).
// Bookmarks/Help/Progress aren't linked here yet — this app has no
// dedicated pages for them (see MobileNav.tsx for the same note).
const primaryLinks = [
  { href: "/home", label: "Home" },
  { href: "/blocks", label: "Practice" },
  { href: "/exam", label: "Exam" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border-default bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <EasterEggTrigger>
          <Link
            href="/home"
            className="flex shrink-0 items-center gap-2.5"
            aria-label="DiagKnow home"
          >
            <span className="text-primary">
              <LogoMark className="size-7 sm:size-8" />
            </span>
            <span className="text-base font-semibold tracking-tight text-text-primary sm:text-lg">
              DiagKnow
            </span>
          </Link>
        </EasterEggTrigger>

        <div className="flex items-center gap-1">
          <ul className="hidden items-center gap-1 md:flex">
            {primaryLinks.map(({ href, label }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href} className="relative">
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "rounded-control px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150",
                      isActive
                        ? "bg-primary/12 text-primary"
                        : "text-text-secondary hover:bg-primary/8 hover:text-text-primary"
                    )}
                  >
                    {label}
                  </Link>
                  {isActive && (
                    <span className="absolute inset-x-3.5 -bottom-px h-0.5 rounded-full bg-primary" />
                  )}
                </li>
              );
            })}
          </ul>

          <span className="mx-1 hidden h-5 w-px bg-border-default md:block" />

          <IconButton
            icon={Trophy}
            label="Leaderboard"
            href="/leaderboard"
            size="sm"
            active={pathname === "/leaderboard" || pathname.startsWith("/leaderboard/")}
            className="hidden md:inline-flex"
          />
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>
    </nav>
  );
}
