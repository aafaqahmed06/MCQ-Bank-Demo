"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
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
import { Card, Button, Progress, Icon, cn } from "@/components/ui";

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
                <h1 className="text-h1 font-bold tracking-tight text-text-primary">
                  Smart Practice
                </h1>
                <p className="text-text-tertiary">
                  A mix of questions across your topics, weighted toward the ones
                  you&apos;re weakest on.
                </p>
              </header>

              {error && (
                <p className="alert-error rounded-control px-4 py-3 text-sm" role="alert">
                  {error}
                </p>
              )}

              {eligibilityLoading ? null : locked && eligibility ? (
                <Card variant="default" padding="lg" className="space-y-4 text-center">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon icon={Lock} size="sm" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {eligibility.attempts} of {eligibility.minAttempts} questions answered
                    </p>
                    <Progress
                      value={(eligibility.attempts / eligibility.minAttempts) * 100}
                      label="Smart Practice eligibility"
                      className="mx-auto mt-2 max-w-xs"
                    />
                  </div>
                  <p className="text-sm text-text-tertiary">
                    Smart Practice needs enough attempt history to actually target your
                    weak topics — right now there isn&apos;t enough to personalize against.
                  </p>
                  <Button href="/blocks" fullWidth>
                    Go Practice
                  </Button>
                </Card>
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
                          className={cn(
                            "rounded-control border px-5 py-3 text-sm font-medium transition-colors duration-150",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-border-default bg-surface text-text-secondary hover:border-primary/50"
                          )}
                        >
                          {count} questions
                        </button>
                      );
                    })}
                  </div>

                  <Button onClick={handleStart} loading={loading} fullWidth size="lg">
                    {loading ? "Building your set…" : "Start Smart Practice"}
                  </Button>
                </>
              )}
            </div>
          )}

          {phase === "practice" && questions && (
            <div className="space-y-4">
              {topicsIncluded !== null && (
                <p className="text-center text-sm text-text-tertiary">
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
