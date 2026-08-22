"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import PracticeSession from "@/components/PracticeSession";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  getSmartPracticeEligibility,
  getSmartPracticeQuestions,
  type SmartPracticeEligibility,
} from "@/lib/smartPractice";
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
  const [eligibility, setEligibility] = useState<SmartPracticeEligibility | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getSmartPracticeEligibility()
      .then((res) => {
        if (active) setEligibility(res);
      })
      .catch(() => {
        // Non-fatal: treat as eligible-unknown and let get_smart_practice_
        // questions' own gate (called on Start) be the source of truth if
        // this upfront check fails.
        if (active) setEligibility(null);
      })
      .finally(() => {
        if (active) setEligibilityLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleStart = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await getSmartPracticeQuestions({ questionCount: selectedCount });
      if (!res.eligible) {
        // Server-enforced gate is authoritative -- surface the same locked
        // panel even if the upfront eligibility check was stale or failed.
        setEligibility({ eligible: false, attempts: res.attempts, minAttempts: res.minAttempts });
        return;
      }
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

  const locked = eligibility !== null && !eligibility.eligible;

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

              {eligibilityLoading ? null : locked && eligibility ? (
                <div className="hud-card space-y-4 rounded-xl border-dashed p-6 text-center sm:p-8">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-[var(--accent-violet)]/10 text-[var(--accent-violet)]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
                      <rect x="5" y="11" width="14" height="9" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-heading)]">
                      {eligibility.attempts} of {eligibility.minAttempts} questions answered
                    </p>
                    <div className="mx-auto mt-2 h-2 w-full max-w-xs rounded-full bg-[var(--bg-progress-track)]">
                      <div
                        className="h-2 rounded-full bg-[var(--accent-violet)] transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (eligibility.attempts / eligibility.minAttempts) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">
                    Smart Practice needs enough attempt history to actually target your
                    weak topics — right now there isn&apos;t enough to personalize against.
                  </p>
                  <Link
                    href="/blocks"
                    className="hud-primary-btn inline-flex rounded-xl px-6 py-3 text-sm font-semibold"
                  >
                    Go Practice
                  </Link>
                </div>
              ) : (
                <>
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
                </>
              )}
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
