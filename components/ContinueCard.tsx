"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { USER_STORAGE_KEY } from "@/lib/data/user";
import type { UserProfile } from "@/types";

export default function ContinueCard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      try {
        setProfile(JSON.parse(raw) as UserProfile);
      } catch {
        setProfile(null);
      }
    }
  }, []);

  if (!profile) return null;

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
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        {profile.college} &middot; Year {profile.year}
      </p>
    </Link>
  );
}
