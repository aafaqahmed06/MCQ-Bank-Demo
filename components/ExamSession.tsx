"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, ArrowLeft, ArrowRight } from "lucide-react";
import type { ExamQuestionPayload, SubmitExamResponse } from "@/types";
import ExamNavigator from "@/components/ExamNavigator";
import { Card, Button, Modal, Icon, cn } from "@/components/ui";

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
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(questions.length).fill(null)
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
    timeLimitSeconds ?? null
  );
  const touchStartY = useRef(0);
  const finishedRef = useRef(false);
  const timeUpTriggeredRef = useRef(false);

  const total = questions.length;
  const currentQuestion = questions[currentIndex];
  const selectedAnswer = answers[currentIndex];
  const answeredCount = answers.filter((a) => a !== null).length;
  const isLastQuestion = currentIndex === total - 1;

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

  // Auto-submit near the deadline (bypasses confirmation — time's up either
  // way). Fires slightly early (remaining <= 2s) so the request reaches the
  // server before started_at + limit expires. Guarded so a failed
  // submission doesn't re-fire the timer-expiry attempt in a loop.
  useEffect(() => {
    if (
      remainingSeconds !== null &&
      remainingSeconds <= 2 &&
      !submitting &&
      !timeUpTriggeredRef.current
    ) {
      timeUpTriggeredRef.current = true;
      void submitAnswers(answers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, submitting]);

  const selectAnswer = (index: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = index;
      return next;
    });
  };

  const goTo = (index: number) => {
    if (index < 0 || index >= total || submitting) return;
    setCurrentIndex(index);
  };

  const lowTime = remainingSeconds !== null && remainingSeconds <= 60;
  const criticalTime = remainingSeconds !== null && remainingSeconds <= 10;

  return (
    <div className="space-y-4">
      {timeLimitSeconds && (
        <div
          aria-live="polite"
          className={cn(
            "fixed top-20 right-4 z-40 flex items-center gap-2 rounded-control border px-3.5 py-2 text-sm font-semibold tabular-nums shadow-elevated backdrop-blur-md",
            criticalTime
              ? "border-error/50 bg-error-soft text-error-text"
              : lowTime
                ? "border-warning/50 bg-warning-soft text-warning-text"
                : "border-border-default bg-surface-elevated/90 text-text-primary"
          )}
        >
          <Icon icon={Clock} size="sm" />
          {formatTime(remainingSeconds ?? 0)}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-text-secondary">
          Question {currentIndex + 1} of {total}{" "}
          <span className="text-text-tertiary">· Answered {answeredCount}</span>
        </p>
        <button
          type="button"
          onClick={onQuit}
          className="rounded-control px-2.5 py-1 text-caption font-medium text-text-tertiary transition-colors duration-150 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          Quit
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_240px] lg:items-start">
        <div className="fade-in">
          {currentQuestion.topic && (
            <p className="text-caption font-semibold tracking-wide text-primary uppercase">
              {currentQuestion.topic}
            </p>
          )}
          <h2 className="mt-2 text-h2 leading-relaxed font-semibold text-text-primary">
            {currentQuestion.question}
          </h2>

          <div className="mt-6 space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  "opt-base p-4 text-base sm:p-5 sm:text-lg",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  selectedAnswer === index && "opt-selected"
                )}
                onClick={() => {
                  if (Math.abs(touchStartY.current) < 10) selectAnswer(index);
                  touchStartY.current = 0;
                }}
                onTouchStart={(e) => {
                  touchStartY.current = e.changedTouches[0].clientY;
                }}
                onTouchEnd={(e) => {
                  const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
                  if (dy < 10) {
                    e.preventDefault();
                    selectAnswer(index);
                  }
                  touchStartY.current = 0;
                }}
              >
                <span className="font-semibold">{String.fromCharCode(65 + index)}.</span>{" "}
                {option}
              </button>
            ))}
          </div>

          {submitError && (
            <p className="alert-error mt-4 rounded-control px-4 py-3 text-sm">{submitError}</p>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
              <Icon icon={ArrowLeft} size="sm" />
              Previous
            </Button>
            {isLastQuestion ? (
              <Button onClick={() => setConfirmSubmitOpen(true)} disabled={submitting}>
                Review &amp; Submit
              </Button>
            ) : (
              <Button onClick={() => goTo(currentIndex + 1)} disabled={submitting}>
                Next Question
                <Icon icon={ArrowRight} size="sm" />
              </Button>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <Card variant="default" padding="md" className="space-y-4">
            <p className="text-caption font-semibold tracking-wide text-text-tertiary uppercase">
              Questions
            </p>
            <ExamNavigator total={total} current={currentIndex} answers={answers} onJump={goTo} />
            <div className="space-y-1.5 text-caption text-text-tertiary">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Answered ({answeredCount})
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full border border-border-default" />
                Unanswered ({total - answeredCount})
              </div>
            </div>
            <Button
              onClick={() => setConfirmSubmitOpen(true)}
              disabled={submitting}
              fullWidth
            >
              Submit Exam
            </Button>
          </Card>
        </aside>
      </div>

      <Modal
        open={confirmSubmitOpen}
        onClose={() => setConfirmSubmitOpen(false)}
        title="Submit exam?"
        size="sm"
      >
        <p className="text-sm text-text-secondary">
          You&apos;ve answered {answeredCount} of {total} questions
          {answeredCount < total ? `, ${total - answeredCount} unanswered` : ""}. Once
          submitted, you can&apos;t change your answers.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmSubmitOpen(false)}>
            Keep reviewing
          </Button>
          <Button
            onClick={() => {
              setConfirmSubmitOpen(false);
              void submitAnswers(answers);
            }}
            loading={submitting}
          >
            Submit Exam
          </Button>
        </div>
      </Modal>
    </div>
  );
}
