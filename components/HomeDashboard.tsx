"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useProfileInfo } from "@/components/useProfileInfo";
import DkBot from "@/components/DkBot";
import { createClient } from "@/lib/supabase/client";

type Stats = {
  questionsAttempted: number;
  accuracy: number | null;
  examsCompleted: number;
  avgScore: number | null;
};

function StatIcon({ label }: { label: string }) {
  const common = "size-5 text-[var(--accent-cyan)]";
  if (label === "Questions practiced") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={common} aria-hidden="true">
        <path d="M9 3h6M10 3v6.5L5.2 18a2 2 0 0 0 1.8 3h10a2 2 0 0 0 1.8-3L14 9.5V3" />
      </svg>
    );
  }
  if (label === "Accuracy") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={common} aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  if (label === "Exams completed") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={common} aria-hidden="true">
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={common} aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}

export default function HomeDashboard() {
  const { profile } = useAuth();
  const info = useProfileInfo();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = createClient();
      const [progRes, examRes] = await Promise.all([
        supabase
          .from("user_topic_progress")
          .select("questions_attempted, questions_correct")
          .order("updated_at", { ascending: false }),
        supabase
          .from("exams")
          .select("status, score, correct_count, total_questions")
          .eq("status", "submitted")
          .order("submitted_at", { ascending: false })
          .limit(1000),
      ]);

      if (!active) return;

      const rows = progRes.data ?? [];
      const attempted = rows.reduce(
        (sum, r) => sum + (r.questions_attempted as number),
        0,
      );
      const correct = rows.reduce(
        (sum, r) => sum + (r.questions_correct as number),
        0,
      );

      const exams = examRes.data ?? [];
      const examsCompleted = exams.length;
      const avgScore =
        examsCompleted > 0
          ? Math.round(
              (exams.reduce((sum, e) => sum + Number(e.score ?? 0), 0) /
                examsCompleted) *
                10,
            ) / 10
          : null;

      setStats({
        questionsAttempted: attempted,
        accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : null,
        examsCompleted,
        avgScore,
      });
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const display =
    info && profile
      ? [info.collegeName, info.programName, info.yearName]
          .filter(Boolean)
          .join(" · ")
      : null;

  const statCards: { label: string; value: string; isSet: boolean }[] = [
    {
      label: "Questions practiced",
      value: stats ? String(stats.questionsAttempted) : "…",
      isSet: stats ? stats.questionsAttempted > 0 : false,
    },
    {
      label: "Accuracy",
      value: stats ? (stats.accuracy === null ? "—" : `${stats.accuracy}%`) : "…",
      isSet: stats ? stats.accuracy !== null : false,
    },
    {
      label: "Exams completed",
      value: stats ? String(stats.examsCompleted) : "…",
      isSet: stats ? stats.examsCompleted > 0 : false,
    },
    {
      label: "Avg exam score",
      value: stats ? (stats.avgScore === null ? "—" : `${stats.avgScore}%`) : "…",
      isSet: stats ? stats.avgScore !== null : false,
    },
  ];

  const hasActivity = stats ? stats.questionsAttempted > 0 : false;

  return (
    <div className="space-y-8">
      {/* Welcome header — prominent but not oversized */}
      <header className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)] sm:text-4xl">
          Welcome back
        </h1>
        {profile?.full_name ? (
          <p className="text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text-body)]">
              {profile.full_name}
            </span>
            {display ? <span className="text-[var(--text-muted)]"> · {display}</span> : null}
          </p>
        ) : (
          <p className="text-[var(--text-muted)]">
            Complete{" "}
            <Link href="/onboarding" className="text-[var(--accent-cyan)] hover:underline">
              onboarding
            </Link>{" "}
            to save your details.
          </p>
        )}
      </header>

      {/* Statistics — scannable white cards */}
      <section
        data-tutorial="stats"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        aria-label="Your statistics"
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            className="hud-card rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <StatIcon label={card.label} />
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  card.isSet
                    ? "bg-cyan-500/10 text-[var(--accent-cyan-strong)]"
                    : "bg-[var(--bg-card-alt)] text-[var(--text-muted)]"
                }`}
              >
                {card.isSet ? "Active" : "Pending"}
              </span>
            </div>
            <p
              className={`mt-4 text-3xl font-semibold tabular-nums ${
                card.isSet
                  ? "text-[var(--text-heading)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              {card.value}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{card.label}</p>
          </div>
        ))}
      </section>

      {!hasActivity && (
        <section className="hud-card rounded-xl border-dashed p-6 text-center sm:p-8">
          <div className="flex justify-center">
            <DkBot state="thumbsUp" size="small" alt={null} />
          </div>
          <p className="mt-3 text-[var(--text-muted)]">
            No activity yet — start practicing or take your first exam simulation
            to build your stats.
          </p>
        </section>
      )}

      {/* Primary actions — teal primary, outlined secondary, quieter leaderboard */}
      <section className="grid gap-4 md:grid-cols-2" aria-label="Quick actions">
        <Link
          data-tutorial="practice"
          href="/blocks"
          className="group flex items-center justify-between rounded-xl bg-[var(--primary-btn-bg)] p-6 text-[var(--primary-btn-text)] transition hover:-translate-y-0.5 hover:bg-[var(--primary-btn-bg-hover)]"
        >
          <div>
            <p className="text-base font-semibold">Start Practice</p>
            <p className="mt-0.5 text-sm text-[var(--primary-btn-text)]/80">
              Revise by block, module and topic
            </p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6 transition-transform group-hover:translate-x-0.5" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>

        <Link
          data-tutorial="exam"
          href="/exam"
          className="group flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 text-[var(--text-body)] transition hover:-translate-y-0.5 hover:border-[var(--accent-cyan)]"
        >
          <div>
            <p className="text-base font-semibold text-[var(--text-heading)]">Exam Simulation</p>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">
              Timed, graded exam under real conditions
            </p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6 text-[var(--accent-cyan)] transition-transform group-hover:translate-x-0.5" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </section>

      <section data-tutorial="leaderboard">
        <Link
          href="/leaderboard"
          className="group flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent-cyan)]"
        >
          <div className="flex items-center gap-3">
            <span className="text-[var(--accent-violet)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
                <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4ZM4 4v1a3 3 0 0 0 3 3M20 4v1a3 3 0 0 1-3 3" />
              </svg>
            </span>
            <div>
              <p className="text-base font-semibold text-[var(--text-heading)]">Leaderboard</p>
              <p className="text-sm text-[var(--text-muted)]">See how you compare with your cohort</p>
            </div>
          </div>
          <span className="text-[var(--text-muted-light)] transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </section>
    </div>
  );
}
