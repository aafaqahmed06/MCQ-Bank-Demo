"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LayoutWrapper from "@/components/LayoutWrapper";
import ContinueCard from "@/components/ContinueCard";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";

type Stats = { mcqs: number; subjects: number; topics: number };

export default function LandingPage() {
  const { loading, user, isProfileComplete } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const hasProfile = !!user && isProfileComplete;

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    (async () => {
      const [{ count: mcqs }, { count: subjects }, { count: topics }] =
        await Promise.all([
          supabase
            .from("mcqs")
            .select("id", { count: "exact", head: true })
            .eq("status", "published"),
          supabase.from("modules").select("id", { count: "exact", head: true }),
          supabase.from("topics").select("id", { count: "exact", head: true }),
        ]);
      if (!active) return;
      setStats({ mcqs: mcqs ?? 0, subjects: subjects ?? 0, topics: topics ?? 0 });
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <LayoutWrapper>
      <div className="flex flex-1 flex-col items-center justify-center py-8 md:py-12">
        <section className="hud-card fade-in w-full rounded-xl p-6 text-center sm:p-8">
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent-cyan)]">
            {stats ? `${stats.mcqs} Practice Questions` : "Practice Questions"}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--text-heading)]">
            DiagKnow
          </h1>
          <p className="hud-muted mx-auto mt-3 max-w-2xl">
            Structured practice by block and module. Build clinical knowledge one
            question at a time.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {loading ? (
              <span className="hud-primary-btn rounded-xl px-8 py-4 font-medium opacity-70">
                Loading…
              </span>
            ) : !hasProfile ? (
              <Link
                href="/auth"
                className="hud-primary-btn rounded-xl px-8 py-4 font-medium"
              >
                Get Started
              </Link>
            ) : (
              <Link
                href="/home"
                className="hud-primary-btn rounded-xl px-8 py-4 font-medium"
              >
                Go to Dashboard
              </Link>
            )}
            {hasProfile && (
              <Link
                href="/blocks"
                className="rounded-xl border border-violet-300/30 bg-[var(--bg-landing-btn)]/60 px-8 py-4 font-medium text-[var(--text-btn-landing)] transition-colors hover:border-cyan-300/40 hover:text-[var(--accent-cyan-strong)] active:border-cyan-300/40 active:text-[var(--accent-cyan-strong)]"
              >
                Browse Blocks
              </Link>
            )}
          </div>
          {loading && (
            <div className="mt-4 h-10" />
          )}
        </section>

        <div className="mt-6 grid w-full grid-cols-3 gap-3">
          <div className="rounded-xl border border-cyan-300/20 bg-[var(--bg-card)] p-4 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold text-[var(--accent-cyan-strong)]">
              {stats ? stats.mcqs : "…"}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">MCQs</p>
          </div>
          <div className="rounded-xl border border-cyan-300/20 bg-[var(--bg-card)] p-4 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold text-[var(--accent-cyan-strong)]">
              {stats ? stats.subjects : "…"}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Subjects</p>
          </div>
          <div className="rounded-xl border border-cyan-300/20 bg-[var(--bg-card)] p-4 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold text-[var(--accent-cyan-strong)]">
              {stats ? stats.topics : "…"}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Topics</p>
          </div>
        </div>

        {!loading && <div className="mt-6 w-full"><ContinueCard /></div>}
      </div>
    </LayoutWrapper>
  );
}