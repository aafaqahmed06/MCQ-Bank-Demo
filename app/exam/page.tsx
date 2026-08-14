"use client";

import { useEffect, useState } from "react";
import { startExam, getPublishedCount, submitExam } from "@/lib/exam";
import type {
  ExamAnswerSubmission,
  ExamQuestionPayload,
  SubmitExamResponse,
} from "@/types";
import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import ExamSession from "@/components/ExamSession";
import ExamResult from "@/components/ExamResult";

type Phase = "select" | "exam" | "result";

const EXAM_OPTIONS: { count: number; label: string; description: string }[] = [
  { count: 20, label: "Concise", description: "A short, focused check" },
  { count: 50, label: "Standard", description: "A full practice paper" },
  { count: 100, label: "Extended", description: "An intensive session" },
];

export default function ExamPage() {
  const [phase, setPhase] = useState<Phase>("select");
  const [starting, setStarting] = useState(false);
  const [selectedCount, setSelectedCount] = useState<number>(20);
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [examId, setExamId] = useState<string | null>(null);
  const [examQuestions, setExamQuestions] = useState<
    ExamQuestionPayload[] | null
  >(null);
  const [result, setResult] = useState<SubmitExamResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPublishedCount()
      .then((count) => {
        if (!cancelled) setAvailableCount(count);
      })
      .catch(() => {
        if (!cancelled) setAvailableCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStart = async (count: number) => {
    if (starting) return;
    setError(null);
    setStarting(true);
    try {
      const exam = await startExam({ questionCount: count });
      setExamId(exam.exam_id);
      setExamQuestions(exam.questions);
      setPhase("exam");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start exam");
      setStarting(false);
    }
  };

  const handleSubmit = async (
    answers: (number | null)[],
  ): Promise<SubmitExamResponse> => {
    if (!examId) throw new Error("No exam in progress");
    const submissions: ExamAnswerSubmission[] = (examQuestions ?? []).map(
      (q, index) => ({
        mcq_id: q.mcq_id,
        selected_answer: answers[index],
      }),
    );
    const res = await submitExam(examId, submissions);
    setResult(res);
    setPhase("result");
    return res;
  };

  const handleStartNew = () => {
    setExamId(null);
    setExamQuestions(null);
    setResult(null);
    setPhase("select");
  };

  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="space-y-6">
          {phase === "select" && (
            <div className="mx-auto w-full max-w-lg space-y-6">
              <header className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">
                  Exam Simulation
                </h1>
                <p className="text-[var(--text-muted)]">
                  {availableCount === null
                    ? "Loading question bank…"
                    : `${availableCount} questions available. Select the length of your exam.`}
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

              <div className="flex flex-col gap-3">
                {EXAM_OPTIONS.map((opt) => {
                  const isSelected = selectedCount === opt.count;
                  return (
                    <button
                      key={opt.count}
                      type="button"
                      onClick={() => setSelectedCount(opt.count)}
                      aria-pressed={isSelected}
                      className={`flex items-center justify-between gap-4 rounded-xl border bg-[var(--bg-card)] p-5 text-left transition-colors ${
                        isSelected
                          ? "border-[var(--accent-cyan)] ring-1 ring-[var(--accent-cyan)]/40"
                          : "border-[var(--border-color)] hover:border-[var(--accent-cyan)]/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`flex size-12 items-center justify-center rounded-lg text-xl font-bold tabular-nums ${
                            isSelected
                              ? "bg-[var(--primary-btn-bg)] text-[var(--primary-btn-text)]"
                              : "bg-[var(--bg-card-alt)] text-[var(--text-heading)]"
                          }`}
                        >
                          {opt.count}
                        </span>
                        <div>
                          <p
                            className={`text-base font-semibold ${
                              isSelected
                                ? "text-[var(--accent-cyan-strong)]"
                                : "text-[var(--text-heading)]"
                            }`}
                          >
                            {opt.label}
                          </p>
                          <p className="text-sm text-[var(--text-muted)]">
                            {opt.description}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`flex size-5 items-center justify-center rounded-full border-2 ${
                          isSelected
                            ? "border-[var(--accent-cyan)] bg-[var(--accent-cyan)] text-white"
                            : "border-[var(--text-muted)]"
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="size-3">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => handleStart(selectedCount)}
                disabled={starting}
                className="hud-primary-btn w-full rounded-xl px-6 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {starting ? "Starting exam…" : `Start ${selectedCount} Question Exam`}
              </button>
            </div>
          )}

          {phase === "exam" && examQuestions && examId && (
            <ExamSession questions={examQuestions} onSubmit={handleSubmit} />
          )}

          {phase === "result" && result && examId && (
            <ExamResult
              examId={examId}
              result={result}
              onStartNew={handleStartNew}
            />
          )}
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}