"use client";

import { useCallback, useState } from "react";
import { getExamReview } from "@/lib/exam";
import type { ExamReviewItem, SubmitExamResponse } from "@/types";
import BookmarkButton from "@/components/BookmarkButton";
import ReportQuestionButton from "@/components/ReportQuestionButton";

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
              <p className={item.is_correct ? "text-[#39ff90]" : "text-[#ff4d6d]"}>
                {item.is_correct ? "Correct" : "Incorrect"}
              </p>
            )}
          </div>
          <div className="mt-3 h-2 rounded-full bg-[var(--bg-progress-track)]">
            <div
              className="h-2 rounded-full bg-cyan-300 transition-all duration-300 shadow-[0_0_14px_rgba(0,224,255,0.35)]"
              style={{ width: `${((reviewIndex + 1) / review.length) * 100}%` }}
            />
          </div>
        </div>

        <section className="hud-card fade-in rounded-xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-[var(--accent-cyan-strong)]">
              Question {item.question_order + 1}
            </p>
            <div className="flex items-center gap-2">
              <BookmarkButton mcqId={item.mcq_id} />
              <ReportQuestionButton mcqId={item.mcq_id} />
            </div>
          </div>
          <h2 className="mt-3 text-xl font-semibold leading-relaxed text-[var(--text-heading)] sm:text-2xl">
            {item.question}
          </h2>

          <div className="my-5 border-t border-cyan-300/20" />

          <div className="space-y-3">
            {item.options.map((option, index) => {
              const isUserAnswer = item.selected_answer === index;
              const isCorrectAnswer = index === item.correct_answer;
              let classes =
                "w-full rounded-xl p-3 sm:p-4 text-left text-base sm:text-lg transition-all duration-200 border ";

              if (isCorrectAnswer) {
                classes +=
                  "border-[#39ff90] bg-[#39ff90]/12 text-[#b7ffd9] shadow-[0_0_18px_rgba(57,255,144,0.3)] ring-1 ring-[#39ff90]/60";
              } else if (isUserAnswer && !isCorrectAnswer) {
                classes +=
                  "border-[#ff4d6d] bg-[#ff4d6d]/12 text-[#ffc3ce] shadow-[0_0_18px_rgba(255,77,109,0.3)] ring-1 ring-[#ff4d6d]/60";
              } else {
                classes +=
                  "border-cyan-300/15 bg-[var(--bg-option)]/50 text-[var(--text-option-dim)]";
              }

              return (
                <div key={index} className={classes}>
                  <span className="font-semibold">
                    {String.fromCharCode(65 + index)}.
                  </span>{" "}
                  {option}
                  {isCorrectAnswer && (
                    <span className="ml-2 text-xs text-[#39ff90]">
                      ✓ Correct answer
                    </span>
                  )}
                  {isUserAnswer && !isCorrectAnswer && (
                    <span className="ml-2 text-xs text-[#ff4d6d]">
                      ✗ Your answer
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-violet-300/35 bg-violet-400/10 p-4 fade-in">
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
              className="rounded-xl border border-cyan-300/30 bg-[var(--bg-card-dim)]/60 px-5 py-3 text-sm font-medium text-[var(--text-btn-secondary)] transition-colors hover:border-cyan-300/40 hover:text-[var(--accent-cyan-strong)] active:border-cyan-300/40 active:text-[var(--accent-cyan-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>
            {reviewIndex < review.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setReviewIndex((prev) => Math.min(review.length - 1, prev + 1))
                }
                className="rounded-xl border border-cyan-300/30 bg-[var(--bg-card-dim)]/60 px-5 py-3 text-sm font-medium text-[var(--text-btn-secondary)] transition-colors hover:border-cyan-300/40 hover:text-[var(--accent-cyan-strong)] active:border-cyan-300/40 active:text-[var(--accent-cyan-strong)]"
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
      <h2 className="text-3xl font-bold text-[var(--text-heading)]">Exam Complete</h2>
      <p className="mt-1 text-[var(--text-muted)]">
        Here&apos;s how you performed.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-cyan-300/25 bg-[var(--bg-card-alt)]/70 p-4">
          <p className="text-sm text-[var(--text-muted)]">Total score</p>
          <p className="text-2xl font-semibold text-[var(--text-body)]">
            {correct} / {total}
          </p>
        </div>
        <div className="rounded-xl border border-violet-300/25 bg-[var(--bg-card-alt-2)]/70 p-4">
          <p className="text-sm text-[var(--text-muted)]">Percentage</p>
          <p className="text-2xl font-semibold text-[var(--text-body)]">
            {percentage}%
          </p>
        </div>
        <div className="rounded-xl border border-[#39ff90]/40 bg-[#39ff90]/10 p-4">
          <p className="text-sm text-[#8fffc1]">Correct</p>
          <p className="text-2xl font-semibold text-[#b8ffd9]">{correct}</p>
        </div>
        <div className="rounded-xl border border-[#ff4d6d]/40 bg-[#ff4d6d]/10 p-4">
          <p className="text-sm text-[#ff9aad]">Incorrect / Unanswered</p>
          <p className="text-2xl font-semibold text-[#ffc3ce]">{incorrect}</p>
        </div>
      </div>

      {reviewError && (
        <p className="mt-4 rounded-xl border border-[#ff4d6d]/40 bg-[#ff4d6d]/10 px-4 py-3 text-sm text-[#ffc3ce]">
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
          className="rounded-xl border border-violet-300/30 bg-[var(--bg-card-dim)]/60 px-5 py-3 text-sm font-medium text-[var(--text-btn-secondary)] transition-colors hover:border-cyan-300/40 hover:text-[var(--accent-cyan-strong)] active:border-cyan-300/40 active:text-[var(--accent-cyan-strong)]"
        >
          Start New Exam
        </button>
      </div>
    </section>
  );
}