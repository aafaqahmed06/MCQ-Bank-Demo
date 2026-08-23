import { createAdminClient } from "@/lib/supabase/admin";
import {
  getTopicCoverage,
  tierFor,
  CRITICAL_MAX_QUESTIONS,
  LOW_MAX_QUESTIONS,
} from "@/lib/coverage";

const TIER_STYLE: Record<string, string> = {
  CRITICAL: "bg-red-500/10 text-error",
  LOW: "bg-amber-500/10 text-[var(--accent-violet)]",
  OK: "bg-cyan-500/10 text-[var(--accent-cyan-strong)]",
};

export default async function AdminCoveragePage() {
  const supabase = createAdminClient();
  const rows = await getTopicCoverage(supabase);

  const critical = rows.filter((r) => tierFor(r.publishedCount) === "CRITICAL").length;
  const low = rows.filter((r) => tierFor(r.publishedCount) === "LOW").length;
  const ok = rows.filter((r) => tierFor(r.publishedCount) === "OK").length;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)]">
          Topic Coverage
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          {rows.length} topics — {critical} critical (0–{CRITICAL_MAX_QUESTIONS}),{" "}
          {low} low ({CRITICAL_MAX_QUESTIONS + 1}–{LOW_MAX_QUESTIONS}), {ok} ok (
          {LOW_MAX_QUESTIONS + 1}+).
        </p>
      </header>

      <div className="hud-card overflow-x-auto rounded-xl p-4 sm:p-6">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wide text-[var(--text-muted-light)]">
              <th className="px-3 py-3 font-medium">Topic</th>
              <th className="px-3 py-3 font-medium">Block</th>
              <th className="px-3 py-3 font-medium">Module</th>
              <th className="px-3 py-3 text-right font-medium">Published</th>
              <th className="px-3 py-3 text-right font-medium">Linked</th>
              <th className="px-3 py-3 font-medium">Diff 1/2/3</th>
              <th className="px-3 py-3 font-medium">Verif v/u/nr/rej</th>
              <th className="px-3 py-3 font-medium">Flag</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const tier = tierFor(row.publishedCount);
              return (
                <tr
                  key={row.id}
                  className="border-b border-[var(--border-color)] text-[var(--text-body)] last:border-0"
                >
                  <td className="px-3 py-3 font-medium text-[var(--text-heading)]">
                    {row.name}
                  </td>
                  <td className="px-3 py-3 text-[var(--text-muted)]">{row.block}</td>
                  <td className="px-3 py-3 text-[var(--text-muted)]">{row.module}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {row.publishedCount}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {row.linkedCount}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {row.difficulty[1]}/{row.difficulty[2]}/{row.difficulty[3]}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {row.verification.verified}/{row.verification.unverified}/
                    {row.verification.needs_review}/{row.verification.rejected}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${TIER_STYLE[tier]}`}
                    >
                      {tier}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
