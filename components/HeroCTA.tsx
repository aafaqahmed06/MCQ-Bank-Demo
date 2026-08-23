"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function HeroCTA() {
  const { loading, user, isProfileComplete } = useAuth();
  const hasProfile = !!user && isProfileComplete;

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      {loading ? (
        <span className="hud-primary-btn rounded-xl px-8 py-4 font-medium opacity-70">
          Loading…
        </span>
      ) : (
        <Link
          href={hasProfile ? "/home" : "/auth"}
          className="hud-primary-btn rounded-xl px-8 py-4 font-medium"
        >
          {hasProfile ? "Go to Dashboard" : "Get started free"}
        </Link>
      )}
      <p className="text-xs text-[var(--text-muted)]">No ads &middot; No credit card</p>
    </div>
  );
}
