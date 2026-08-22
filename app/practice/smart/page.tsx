"use client";

import { useState } from "react";
import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import PracticeSession from "@/components/PracticeSession";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getSmartPracticeQuestions } from "@/lib/smartPractice";
import type { MCQ } from "@/types";

type Phase = "select" | "practice";

const QUESTION_COUNTS = [10, 20, 30];

export default function SmartPracticePage() {
  const [phase, setPhase] = useState<Phase>("select");
  const [selectedCount, setSelectedCount] = useState(20);
  const [questions, setQuestions] = useState<MCQ[] | null>(null);
  const [topicsIncluded, setTopicsIncluded] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await getSmartPracticeQuestions({ questionCount: selectedCount });
      if (res.questions.length === 0) {
        setError("No questions available for Smart Practice yet.");
        return;
      }
      setQuestions(res.questions);
      setTopicsIncluded(res.topicsIncluded);
      setPhase("practice");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start Smart Practice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="space-y-6">
          {phase === "select" && (
            <div className="mx-auto w-full max-w-lg space-y-6">
              <Breadcrumbs
                items={[{ label: "Blocks", href: "/blocks" }, { label: "Smart Practice" }]}
              />
              <header className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">
                  Smart Practice
                </h1>
                <p className="text-[var(--text-muted)]">
                  A mix of questions across your topics, weighted toward the ones
                  you&apos;re weakest on.
                </p>
              </header>

              {error && (
                <p
                  className="rounded-xl border border-[var(--error)]/40 bg-[var(--error-soft)] px-4 py-3 text-sm text-[var(--error-text)]"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="flex justify-center gap-3">
                {QUESTION_COUNTS.map((count) => {
                  const isSelected = selectedCount === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setSelectedCount(count)}
                      aria-pressed={isSelected}
                      className={`rounded-xl border px-5 py-3 text-sm font-medium transition-colors ${
                        isSelected
                          ? "border-[var(--accent-cyan)] bg-[var(--primary-btn-bg)] text-[var(--primary-btn-text)]"
                          : "border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-body)] hover:border-[var(--accent-cyan)]/50"
                      }`}
                    >
                      {count} questions
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleStart}
                disabled={loading}
                className="hud-primary-btn w-full rounded-xl px-6 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Building your set…" : "Start Smart Practice"}
              </button>
            </div>
          )}

          {phase === "practice" && questions && (
            <div className="space-y-4">
              {topicsIncluded !== null && (
                <p className="text-center text-sm text-[var(--text-muted)]">
                  Drawing from {topicsIncluded} topic{topicsIncluded === 1 ? "" : "s"}
                </p>
              )}
              <PracticeSession questions={questions} backHref="/blocks" />
            </div>
          )}
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}
