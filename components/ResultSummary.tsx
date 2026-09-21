"use client";

import DkBot from "@/components/DkBot";
import { Card, Button } from "@/components/ui";

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
  const botState =
    percentage >= 80 ? "celebrating" :
    percentage >= 50 ? "happy" :
    "thinking";

  return (
    <Card variant="elevated" padding="lg" className="mx-auto w-full max-w-[800px] text-center">
      <div className="flex justify-center">
        <DkBot state={botState} size="medium" alt={null} />
      </div>
      <h2 className="mt-4 text-display font-bold tracking-tight text-text-primary">
        Session Complete
      </h2>
      <p className="mt-1 text-text-tertiary">Review your performance below.</p>

      <div className="mt-5 grid gap-4 text-left sm:grid-cols-2">
        <div className="rounded-card border border-border-default bg-surface p-5">
          <p className="text-sm text-text-tertiary">Total score</p>
          <p className="mt-1 text-h1 font-semibold tabular-nums text-text-primary">
            {correct} <span className="text-lg text-text-tertiary">/ {total}</span>
          </p>
        </div>
        <div className="rounded-card border border-border-default bg-surface p-5">
          <p className="text-sm text-text-tertiary">Percentage</p>
          <p className="mt-1 text-h1 font-semibold tabular-nums text-text-primary">{percentage}%</p>
        </div>
        <div className="box-success rounded-card p-5">
          <p className="text-sm">Correct</p>
          <p className="mt-1 text-h1 font-semibold tabular-nums">{correct}</p>
        </div>
        <div className="box-error rounded-card p-5">
          <p className="text-sm">Incorrect</p>
          <p className="mt-1 text-h1 font-semibold tabular-nums">{incorrect}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          onClick={onRestart}
          onTouchEnd={(e) => {
            e.preventDefault();
            onRestart();
          }}
        >
          Restart Session
        </Button>
        <Button href={backHref} variant="secondary">
          Back to modules
        </Button>
      </div>
    </Card>
  );
}
