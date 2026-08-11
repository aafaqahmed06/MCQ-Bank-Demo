"use client";

import Link from "next/link";
import LayoutWrapper from "@/components/LayoutWrapper";
import ContinueCard from "@/components/ContinueCard";
import { useAuth } from "@/components/AuthProvider";
import { TOTAL_MCQS, TOTAL_SUBJECTS } from "@/lib/data/stats";

export default function LandingPage() {
  const { loading, user, isProfileComplete } = useAuth();
  const hasProfile = !!user && isProfileComplete;

  return (
    <LayoutWrapper>
      <div className="flex flex-1 flex-col items-center justify-center py-8 md:py-12">
        <section className="hud-card fade-in w-full rounded-xl p-6 text-center sm:p-8">
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent-cyan)]">
            {TOTAL_MCQS} Practice Questions
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
              {TOTAL_MCQS}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">MCQs</p>
          </div>
          <div className="rounded-xl border border-cyan-300/20 bg-[var(--bg-card)] p-4 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold text-[var(--accent-cyan-strong)]">
              {TOTAL_SUBJECTS}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Subjects</p>
          </div>
          <div className="rounded-xl border border-cyan-300/20 bg-[var(--bg-card)] p-4 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold text-[var(--accent-cyan-strong)]">
              {TOTAL_SUBJECTS * 3}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Topics</p>
          </div>
        </div>

        {!loading && <div className="mt-6 w-full"><ContinueCard /></div>}
      </div>
    </LayoutWrapper>
  );
}
