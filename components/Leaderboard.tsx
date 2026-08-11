"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LeaderboardRow = {
  rank: number;
  full_name: string | null;
  college_short_name: string | null;
  program_name: string | null;
  exams_completed: number;
  total_correct: number;
  accuracy: number;
};

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
      <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
        Could not load leaderboard: {error}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="hud-muted py-10 text-center">
        No results yet. Complete an exam to get ranked.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-cyan-300/20 text-xs uppercase tracking-wide text-[var(--text-muted-light)]">
            <th className="px-3 py-3">Rank</th>
            <th className="px-3 py-3">Student</th>
            <th className="px-3 py-3">College</th>
            <th className="px-3 py-3">Program</th>
            <th className="px-3 py-3 text-right">Exams</th>
            <th className="px-3 py-3 text-right">Correct</th>
            <th className="px-3 py-3 text-right">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.rank}
              className="border-b border-cyan-300/10 text-[var(--text-body)]"
            >
              <td className="px-3 py-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/25 bg-[var(--bg-card-dim)]/60 text-xs font-semibold text-[var(--accent-cyan-strong)]">
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
              <td className="px-3 py-3 text-right">{row.exams_completed}</td>
              <td className="px-3 py-3 text-right">{row.total_correct}</td>
              <td className="px-3 py-3 text-right">
                {row.accuracy === null ? "—" : `${row.accuracy}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}