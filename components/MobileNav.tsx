"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, ClipboardCheck, Trophy, CircleUserRound } from "lucide-react";
import { Icon, cn } from "@/components/ui";

/** Mobile's own nav model (§ application shell) — not the desktop navbar
 * collapsed into a hamburger. "Practice" maps to /blocks (the curriculum
 * entry point) and "Ranks" to /leaderboard: this app has no dedicated
 * Progress page yet, so the 4th slot uses the closest existing route
 * instead of linking somewhere that doesn't exist. */
const TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/blocks", label: "Practice", icon: BookOpen },
  { href: "/exam", label: "Exam", icon: ClipboardCheck },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
  { href: "/account", label: "Me", icon: CircleUserRound },
] as const;

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border-default bg-surface/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around">
        {TABS.map(({ href, label, icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2.5 text-caption font-medium transition-colors duration-150",
                  isActive
                    ? "text-primary"
                    : "text-text-tertiary hover:text-text-primary"
                )}
              >
                <Icon icon={icon} size="md" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
