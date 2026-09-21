"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DkBot from "@/components/DkBot";
import { Badge, Button, Icon, Skeleton, cn } from "@/components/ui";

type LeaderboardRow = {
  rank: number;
  full_name: string | null;
  college_short_name: string | null;
  program_name: string | null;
  exams_completed: number;
  total_correct: number;
  accuracy: number;
};

const MEDAL_VARIANT: Record<number, "primary" | "neutral"> = {
  1: "primary",
  2: "primary",
  3: "primary",
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
    return (
      <div className="space-y-3 py-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="alert-error rounded-control px-4 py-3 text-sm">Could not load leaderboard: {error}</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="py-6 text-center">
        <div className="flex justify-center">
          <DkBot state="thinking" size="small" alt={null} />
        </div>
        <p className="mt-3 text-lg font-semibold text-text-primary">No results yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-text-tertiary">
          Rankings appear once students complete exams. Take an exam simulation
          to earn a spot on the board.
        </p>
        <Button href="/exam" className="mt-5">
          Take an exam
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[540px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border-default text-caption tracking-wide text-text-tertiary uppercase">
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
            <tr key={row.rank} className="border-b border-border-subtle text-text-secondary last:border-0">
              <td className="px-3 py-3">
                {row.rank <= 3 ? (
                  <Badge variant={MEDAL_VARIANT[row.rank]} size="sm">
                    <Icon icon={Trophy} size="xs" />
                    {row.rank}
                  </Badge>
                ) : (
                  <span
                    className={cn(
                      "inline-flex h-6 min-w-6 items-center justify-center rounded-badge text-caption font-semibold text-text-tertiary"
                    )}
                  >
                    {row.rank}
                  </span>
                )}
              </td>
              <td className="px-3 py-3 font-medium text-text-primary">
                {row.full_name || "Anonymous"}
              </td>
              <td className="px-3 py-3 text-text-tertiary">{row.college_short_name ?? "—"}</td>
              <td className="px-3 py-3 text-text-tertiary">{row.program_name ?? "—"}</td>
              <td className="px-3 py-3 text-right tabular-nums">{row.exams_completed}</td>
              <td className="px-3 py-3 text-right font-semibold tabular-nums text-text-primary">
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
