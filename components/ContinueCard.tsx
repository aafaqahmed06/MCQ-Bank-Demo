"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useProfileInfo } from "@/components/useProfileInfo";

export default function ContinueCard() {
  const { user, isProfileComplete } = useAuth();
  const info = useProfileInfo();

  if (!user || !isProfileComplete) return null;

  return (
    <Link
      href="/blocks"
      className="hud-card hud-card-hover block rounded-xl p-5 text-center"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent-cyan)]">
        Continue where you left off
      </p>
      <p className="mt-1 text-lg font-semibold text-[var(--text-heading)]">
        Go to Blocks &rarr;
      </p>
      {info && (
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {info.collegeName} &middot; {info.yearName}
        </p>
      )}
    </Link>
  );
}