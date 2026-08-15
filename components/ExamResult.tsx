"use client";

import { useCallback, useState } from "react";
import { getExamReview } from "@/lib/exam";
import type { ExamReviewItem, SubmitExamResponse } from "@/types";
import BookmarkButton from "@/components/BookmarkButton";
import ReportQuestionButton from "@/components/ReportQuestionButton";
import DkBot from "@/components/DkBot";

type ExamResultProps = {
  examId: string;
  result: SubmitExamResponse;
  onStartNew: () => void;
};

export default function ExamResult({
  examId,
  result,
  onStartNew,
}: ExamResultProps) {
  const [showReview, setShowReview] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [review, setReview] = useState<ExamReviewItem[] | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);

  const total = result.total_questions;
  const correct = result.correct_count;
  const percentage = result.score;
  const incorrect = total - correct;

  const botState =
    percentage >= 80 ? "celebrating" :
    percentage >= 50 ? "happy" :
    "concerned";

  const loadReview = useCallback(async () => {
    setReviewError(null);
    setLoadingReview(true);
    try {
      const items = await getExamReview(examId);
      setReview(items);
      setReviewIndex(0);
      setShowReview(true);
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Failed to load review"
      );
    } finally {
      setLoadingReview(false);
    }
  }, [examId]);

  if (showReview && review) {
    const item = review[reviewIndex];

    return (
      <div className="space-y-6">
        <div className="hud-card rounded-xl p-4">
          <div className="flex items-center justify-between gap-4 text-sm text-[var(--text-muted-light)]">
            <p>
              Question {reviewIndex + 1} of {review.length}
            </p>
            {item.selected_answer !== null && (
              <p className={item.is_correct ? "text-success" : "text-error"}>
                {item.is_correct ? "Correct" : "Incorrect"}
              </p>
            )}
          </div>
          <div className="mt-3 h-2 rounded-full bg-[var(--bg-progress-track)]">
            <div
              className="h-2 rounded-full bg-[var(--accent-cyan)] transition-all duration-300"
              style={{ width: `${((reviewIndex + 1) / review.length) * 100}%` }}
            />
          </div>
        </div>

        <section className="hud-card fade-in rounded-xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="inline-flex rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-[var(--accent-cyan-strong)]">
              Question {item.question_order + 1}
            </p>
            <div className="flex items-center gap-2">
              <BookmarkButton mcqId={item.mcq_id} />
              <ReportQuestionButton mcqId={item.mcq_id} />
            </div>
          </div>
          <h2 className="mt-4 text-xl font-semibold leading-relaxed text-[var(--text-heading)] sm:text-2xl">
            {item.question}
          </h2>

          <div className="my-5 border-t border-[var(--border-color)]" />

          <div className="space-y-3">
            {item.options.map((option, index) => {
              const isUserAnswer = item.selected_answer === index;
              const isCorrectAnswer = index === item.correct_answer;
              let classes = "opt-base p-3 sm:p-4 text-base sm:text-lg ";

              if (isCorrectAnswer) {
                classes += "opt-correct";
              } else if (isUserAnswer && !isCorrectAnswer) {
                classes += "opt-wrong";
              } else {
                classes += "opt-neutral";
              }

              return (
                <div key={index} className={classes}>
                  <span className="font-semibold">
                    {String.fromCharCode(65 + index)}.
                  </span>{" "}
                  {option}
                  {isCorrectAnswer && (
                    <span className="ml-2 text-xs text-success">
                      ✓ Correct answer
                    </span>
                  )}
                  {isUserAnswer && !isCorrectAnswer && (
                    <span className="ml-2 text-xs text-error">
                      ✗ Your answer
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] p-4 fade-in">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-violet)]">
              Explanation
            </p>
            <p className="mt-1 text-sm text-[var(--text-body-alt)] sm:text-base">
              {item.explanation}
            </p>
          </div>

          <div className="mt-5 flex justify-between">
            <button
              type="button"
              onClick={() => setReviewIndex((prev) => Math.max(0, prev - 1))}
              disabled={reviewIndex === 0}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] px-5 py-3 text-sm font-medium text-[var(--text-btn-secondary)] transition-colors hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>
            {reviewIndex < review.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setReviewIndex((prev) => Math.min(review.length - 1, prev + 1))
                }
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] px-5 py-3 text-sm font-medium text-[var(--text-btn-secondary)] transition-colors hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan-strong)]"
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowReview(false)}
                className="hud-primary-btn rounded-xl px-5 py-3 text-sm font-medium"
              >
                Back to Results
              </button>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <section className="hud-card fade-in rounded-xl p-6">
      <div className="flex justify-center">
        <DkBot state={botState} size="medium" alt={null} />
      </div>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-heading)]">Exam Complete</h2>
      <p className="mt-1 text-[var(--text-muted)]">
        Here&apos;s how you performed.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
          <p className="text-sm text-[var(--text-muted)]">Total score</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-[var(--text-heading)]">
            {correct} <span className="text-lg text-[var(--text-muted)]">/ {total}</span>
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
          <p className="text-sm text-[var(--text-muted)]">Percentage</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-[var(--text-heading)]">
            {percentage}%
          </p>
        </div>
        <div className="box-success rounded-xl p-5">
          <p className="text-sm">Correct</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{correct}</p>
        </div>
        <div className="box-error rounded-xl p-5">
          <p className="text-sm">Incorrect / Unanswered</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{incorrect}</p>
        </div>
      </div>

      {reviewError && (
        <p className="alert-error mt-4 rounded-xl px-4 py-3 text-sm">
          {reviewError}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={loadReview}
          disabled={loadingReview}
          className="hud-primary-btn rounded-xl px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingReview ? "Loading…" : "Review Answers"}
        </button>
        <button
          type="button"
          onClick={onStartNew}
          onTouchEnd={(e) => {
            e.preventDefault();
            onStartNew();
          }}
          className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] px-5 py-3 text-sm font-medium text-[var(--text-btn-secondary)] transition-colors hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan-strong)]"
        >
          Start New Exam
        </button>
      </div>
    </section>
  );
}