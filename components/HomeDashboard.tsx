"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useProfileInfo } from "@/components/useProfileInfo";

export default function HomeDashboard() {
  const { profile } = useAuth();
  const info = useProfileInfo();

  const display =
    info && profile
      ? [info.collegeName, info.programName, info.yearName]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <div className="space-y-6">
      <section className="hud-card fade-in rounded-xl p-6">
        <h1 className="text-3xl font-bold text-[var(--text-heading)]">Welcome back</h1>
        {profile?.full_name ? (
          <p className="hud-muted mt-2">
            <span className="font-medium text-[var(--text-body)]">{profile.full_name}</span>
            {display ? ` · ${display}` : ""}
          </p>
        ) : (
          <p className="hud-muted mt-2">
            Complete{" "}
            <Link href="/onboarding" className="text-[var(--accent-cyan)] hover:underline">
              onboarding
            </Link>{" "}
            to save your details.
          </p>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/blocks"
          className="hud-card hud-card-hover rounded-xl p-4 text-center"
        >
          <span className="font-semibold text-[var(--accent-cyan-strong)]">Start Practice</span>
        </Link>
        <Link
          href="/exam"
          className="hud-card hud-card-hover rounded-xl p-4 text-center"
        >
          <span className="font-semibold text-[var(--accent-cyan-strong)]">Exam Simulation</span>
        </Link>
        <Link
          href="/leaderboard"
          className="hud-card hud-card-hover rounded-xl p-4 text-center"
        >
          <span className="font-semibold text-[var(--accent-cyan-strong)]">Leaderboard</span>
        </Link>
      </section>
    </div>
  );
}