"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { USER_STORAGE_KEY } from "@/lib/data/user";
import type { UserProfile } from "@/types";

export default function HomeDashboard() {
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

  return (
    <div className="space-y-6">
      <section className="hud-card fade-in rounded-xl p-6">
        <h1 className="text-3xl font-bold text-[#f2f8ff]">Welcome back</h1>
        {profile ? (
          <p className="hud-muted mt-2">
            <span className="font-medium text-[#e6f6ff]">{profile.college}</span>
            {" · "}
            Year {profile.year}
          </p>
        ) : (
          <p className="hud-muted mt-2">
            Complete{" "}
            <Link href="/onboarding" className="text-cyan-300 hover:underline">
              onboarding
            </Link>{" "}
            to save your college and year.
          </p>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/blocks"
          className="hud-card hud-card-hover rounded-xl p-4 text-center"
        >
          <span className="font-semibold text-cyan-200">Start Practice</span>
        </Link>
        <Link
          href="/exam"
          className="hud-card hud-card-hover rounded-xl p-4 text-center"
        >
          <span className="font-semibold text-cyan-200">Exam Simulation</span>
        </Link>
        <Link
          href="/leaderboard"
          className="hud-card hud-card-hover rounded-xl p-4 text-center"
        >
          <span className="font-semibold text-cyan-200">Leaderboard</span>
        </Link>
      </section>
    </div>
  );
}
