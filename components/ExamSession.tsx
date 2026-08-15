"use client";

import { useEffect, useRef, useState } from "react";
import type { ExamQuestionPayload, SubmitExamResponse } from "@/types";

type ExamSessionProps = {
  questions: ExamQuestionPayload[];
  timeLimitSeconds?: number;
  onQuit: () => void;
  onSubmit: (answers: (number | null)[]) => Promise<SubmitExamResponse>;
};

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ExamSession({
  questions,
  timeLimitSeconds,
  onQuit,
  onSubmit,
}: ExamSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(questions.length).fill(null)
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
    timeLimitSeconds ?? null
  );
  const touchStartY = useRef(0);
  const finishedRef = useRef(false);
  const timeUpTriggeredRef = useRef(false);

  const total = questions.length;
  const currentQuestion = questions[currentIndex];
  const answeredCount = answers.filter((a) => a !== null).length;

  // Countdown timer. Deadline is anchored to when the session mounts so the
  // displayed clock stays aligned with the server's started_at + limit.
  useEffect(() => {
    if (!timeLimitSeconds) return;
    const deadline = Date.now() + timeLimitSeconds * 1000;
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.round((deadline - Date.now()) / 1000)
      );
      setRemainingSeconds(remaining);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [timeLimitSeconds]);

  const submitAnswers = async (finalAnswers: (number | null)[]) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(finalAnswers);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit exam"
      );
      finishedRef.current = false;
      setSubmitting(false);
    }
  };

  // Auto-submit near the deadline. We fire slightly early (remaining <= 2s) so
  // the request reaches the server before started_at + limit expires. Guarded so
  // a failed submission doesn't re-fire the timer-expiry attempt in a loop.
  useEffect(() => {
    if (
      remainingSeconds !== null &&
      remainingSeconds <= 2 &&
      !submitting &&
      !timeUpTriggeredRef.current
    ) {
      timeUpTriggeredRef.current = true;
      const finalAnswers = [...answers];
      finalAnswers[currentIndex] = selectedAnswer;
      void submitAnswers(finalAnswers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, submitting]);

  const handleNext = async () => {
    if (selectedAnswer === null || submitting || finishedRef.current) return;

    const newAnswers = [...answers];
    newAnswers[currentIndex] = selectedAnswer;
    setAnswers(newAnswers);

    if (currentIndex === total - 1) {
      await submitAnswers(newAnswers);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    }
  };

  const lowTime = remainingSeconds !== null && remainingSeconds <= 60;
  const criticalTime = remainingSeconds !== null && remainingSeconds <= 10;

  return (
    <div className="space-y-6">
      {timeLimitSeconds && (
        <div
          aria-live="polite"
          className={`fixed right-4 top-20 z-40 flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold tabular-nums shadow-lg backdrop-blur-md ${
            criticalTime
              ? "border-[var(--error)]/60 bg-[var(--error-soft)] text-[var(--error-text)]"
              : lowTime
                ? "border-amber-400/50 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                : "hud-card bg-[var(--bg-nav-inner)]/90 text-[var(--text-heading)]"
          }`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          {formatTime(remainingSeconds ?? 0)}
        </div>
      )}

      <div className="hud-card rounded-xl p-4">
        <div className="flex items-center justify-between gap-4 text-sm text-[var(--text-muted-light)]">
          <p>
            Question {currentIndex + 1} of {total}
          </p>
          <p>Answered: {answeredCount}</p>
          {timeLimitSeconds && (
            <button
              type="button"
              onClick={onQuit}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-[var(--text-muted-light)] transition-colors hover:text-[var(--error)]"
            >
              Quit
            </button>
          )}
        </div>
        <div className="mt-3 h-2 rounded-full bg-[var(--bg-progress-track)]">
          <div
            className="h-2 rounded-full bg-[var(--accent-cyan)] transition-all duration-300"
            style={{ width: `${(answeredCount / total) * 100}%` }}
          />
        </div>
      </div>

      <section className="hud-card fade-in rounded-xl p-5 sm:p-6">
        {currentQuestion.topic && (
          <p className="inline-flex rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-[var(--accent-cyan-strong)]">
            Topic: {currentQuestion.topic}
          </p>
        )}
        <h2 className="mt-4 text-xl font-semibold leading-relaxed text-[var(--text-heading)] sm:text-2xl">
          {currentQuestion.question}
        </h2>

        <div className="my-5 border-t border-[var(--border-color)]" />

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              type="button"
              className={`opt-base p-3 sm:p-4 text-base sm:text-lg ${
                selectedAnswer === index ? "opt-selected" : ""
              }`}
              onClick={() => {
                if (Math.abs(touchStartY.current) < 10)
                  setSelectedAnswer(index);
                touchStartY.current = 0;
              }}
              onTouchStart={(e) => {
                touchStartY.current = e.changedTouches[0].clientY;
              }}
              onTouchEnd={(e) => {
                const dy = Math.abs(
                  e.changedTouches[0].clientY - touchStartY.current
                );
                if (selectedAnswer === null && dy < 10) {
                  e.preventDefault();
                  setSelectedAnswer(index);
                }
                touchStartY.current = 0;
              }}
            >
              <span className="font-semibold">
                {String.fromCharCode(65 + index)}.
              </span>{" "}
              {option}
            </button>
          ))}
        </div>

        {submitError && (
          <p className="alert-error mt-4 rounded-xl px-4 py-3 text-sm">
            {submitError}
          </p>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => void handleNext()}
            onTouchStart={(e) => {
              touchStartY.current = e.changedTouches[0].clientY;
            }}
            onTouchEnd={(e) => {
              const dy = Math.abs(
                e.changedTouches[0].clientY - touchStartY.current
              );
              if (selectedAnswer !== null && !submitting && dy < 10) {
                e.preventDefault();
                void handleNext();
              }
              touchStartY.current = 0;
            }}
            disabled={selectedAnswer === null || submitting}
            className="hud-primary-btn rounded-xl px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Submitting…"
              : currentIndex === total - 1
                ? "Finish Exam"
                : "Next Question"}
          </button>
        </div>
      </section>
    </div>
  );
}