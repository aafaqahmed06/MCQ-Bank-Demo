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
      <h2 className="text-3xl font-bold text-[var(--text-heading)]">Session Complete</h2>
      <p className="mt-1 text-[var(--text-muted)]">Review your performance below.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-cyan-300/25 bg-[var(--bg-card-alt)]/70 p-4">
          <p className="text-sm text-[var(--text-muted)]">Total score</p>
          <p className="text-2xl font-semibold text-[var(--text-body)]">
            {correct} / {total}
          </p>
        </div>
        <div className="rounded-xl border border-violet-300/25 bg-[var(--bg-card-alt-2)]/70 p-4">
          <p className="text-sm text-[var(--text-muted)]">Percentage</p>
          <p className="text-2xl font-semibold text-[var(--text-body)]">{percentage}%</p>
        </div>
        <div className="rounded-xl border border-[#39ff90]/40 bg-[#39ff90]/10 p-4">
          <p className="text-sm text-[#8fffc1]">Correct</p>
          <p className="text-2xl font-semibold text-[#b8ffd9]">{correct}</p>
        </div>
        <div className="rounded-xl border border-[#ff4d6d]/40 bg-[#ff4d6d]/10 p-4">
          <p className="text-sm text-[#ff9aad]">Incorrect</p>
          <p className="text-2xl font-semibold text-[#ffc3ce]">{incorrect}</p>
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
          className="rounded-xl border border-violet-300/30 bg-[var(--bg-card-dim)]/60 px-5 py-3 text-sm font-medium text-[var(--text-btn-secondary)] transition-colors hover:border-cyan-300/40 hover:text-cyan-200 active:border-cyan-300/40 active:text-cyan-200"
        >
          Back to modules
        </Link>
      </div>
    </section>
  );
}
