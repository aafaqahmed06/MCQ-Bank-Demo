"use client";

import Link from "next/link";

type ResultSummaryProps = {
  correct: number;
  total: number;
  onRestart: () => void;
  backHref: string;
};

export default function ResultSummary({
  correct,
  total,
  onRestart,
  backHref,
}: ResultSummaryProps) {
  const incorrect = total - correct;
  const percentage = total === 0 ? 0 : Math.round((correct / total) * 100);

  return (
    <section className="hud-card fade-in rounded-xl p-6">
      <h2 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">Session Complete</h2>
      <p className="mt-1 text-[var(--text-muted)]">Review your performance below.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
          <p className="text-sm text-[var(--text-muted)]">Total score</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-[var(--text-heading)]">
            {correct} <span className="text-lg text-[var(--text-muted)]">/ {total}</span>
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
          <p className="text-sm text-[var(--text-muted)]">Percentage</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-[var(--text-heading)]">{percentage}%</p>
        </div>
        <div className="box-success rounded-xl p-5">
          <p className="text-sm">Correct</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{correct}</p>
        </div>
        <div className="box-error rounded-xl p-5">
          <p className="text-sm">Incorrect</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{incorrect}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRestart}
          onTouchEnd={(e) => { e.preventDefault(); onRestart(); }}
          className="hud-primary-btn rounded-xl px-5 py-3 text-sm font-medium"
        >
          Restart Session
        </button>
        <Link
          href={backHref}
          className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] px-5 py-3 text-sm font-medium text-[var(--text-btn-secondary)] transition-colors hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan-strong)]"
        >
          Back to modules
        </Link>
      </div>
    </section>
  );
}