"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useProfileInfo } from "@/components/useProfileInfo";
import { createClient } from "@/lib/supabase/client";

type Stats = {
  questionsAttempted: number;
  accuracy: number | null;
  examsCompleted: number;
  avgScore: number | null;
};

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

  const statCards: { label: string; value: string }[] = [
    {
      label: "Questions practiced",
      value: stats ? String(stats.questionsAttempted) : "…",
    },
    {
      label: "Accuracy",
      value: stats ? (stats.accuracy === null ? "—" : `${stats.accuracy}%`) : "…",
    },
    {
      label: "Exams completed",
      value: stats ? String(stats.examsCompleted) : "…",
    },
    {
      label: "Avg exam score",
      value: stats ? (stats.avgScore === null ? "—" : `${stats.avgScore}%`) : "…",
    },
  ];

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

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-cyan-300/20 bg-[var(--bg-card)] p-4 text-center backdrop-blur-sm"
          >
            <p className="text-2xl font-bold text-[var(--accent-cyan-strong)]">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{card.label}</p>
          </div>
        ))}
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
