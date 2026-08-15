"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import DkBot from "@/components/DkBot";

type LeaderboardRow = {
  rank: number;
  full_name: string | null;
  college_short_name: string | null;
  program_name: string | null;
  exams_completed: number;
  total_correct: number;
  accuracy: number;
};

function medalTone(rank: number): string {
  if (rank === 1) return "bg-cyan-500/12 text-[var(--accent-cyan-strong)]";
  if (rank === 2) return "bg-violet-500/10 text-[var(--accent-violet)]";
  if (rank === 3) return "bg-[var(--bg-card-alt)] text-[var(--text-muted-light)]";
  return "bg-transparent text-[var(--text-muted-light)]";
}

export default function Leaderboard() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase
      .rpc("get_leaderboard", { p_limit: 50 })
      .then(({ data, error: err }) => {
        if (!active) return;
        if (err) {
          setError(err.message);
        } else {
          setRows((data ?? []) as LeaderboardRow[]);
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="hud-muted py-10 text-center">Loading leaderboard…</p>;
  }

  if (error) {
    return (
      <p className="rounded-xl border border-[var(--error)]/30 bg-[var(--error-soft)] px-4 py-3 text-sm text-[var(--error-text)]">
        Could not load leaderboard: {error}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-6 text-center">
        <div className="flex justify-center">
          <DkBot state="thinking" size="small" alt={null} />
        </div>
        <p className="mt-3 text-lg font-semibold text-[var(--text-heading)]">
          No results yet
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-muted)]">
          Rankings appear once students complete exams. Take an exam simulation
          to earn a spot on the board.
        </p>
        <Link
          href="/exam"
          className="hud-primary-btn mt-5 inline-block rounded-xl px-5 py-2.5 text-sm font-medium"
        >
          Take an exam
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[540px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wide text-[var(--text-muted-light)]">
            <th className="px-3 py-3 font-medium">Rank</th>
            <th className="px-3 py-3 font-medium">Student</th>
            <th className="px-3 py-3 font-medium">College</th>
            <th className="px-3 py-3 font-medium">Program</th>
            <th className="px-3 py-3 text-right font-medium">Exams</th>
            <th className="px-3 py-3 text-right font-medium">Correct</th>
            <th className="px-3 py-3 text-right font-medium">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.rank}
              className="border-b border-[var(--border-color)] text-[var(--text-body)] last:border-0"
            >
              <td className="px-3 py-3">
                <span
                  className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-xs font-semibold ${medalTone(
                    row.rank,
                  )}`}
                >
                  {row.rank}
                </span>
              </td>
              <td className="px-3 py-3 font-medium text-[var(--text-heading)]">
                {row.full_name || "Anonymous"}
              </td>
              <td className="px-3 py-3 text-[var(--text-muted)]">
                {row.college_short_name ?? "—"}
              </td>
              <td className="px-3 py-3 text-[var(--text-muted)]">
                {row.program_name ?? "—"}
              </td>
              <td className="px-3 py-3 text-right tabular-nums">
                {row.exams_completed}
              </td>
              <td className="px-3 py-3 text-right font-semibold tabular-nums text-[var(--text-heading)]">
                {row.total_correct}
              </td>
              <td className="px-3 py-3 text-right tabular-nums">
                {row.accuracy === null ? "—" : `${row.accuracy}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}