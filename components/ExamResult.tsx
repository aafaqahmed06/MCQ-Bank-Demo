"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { getExamReview } from "@/lib/exam";
import type { ExamReviewItem, SubmitExamResponse } from "@/types";
import BookmarkButton from "@/components/BookmarkButton";
import ReportQuestionButton from "@/components/ReportQuestionButton";
import DkBot from "@/components/DkBot";
import { Card, Button, Progress, Icon, cn } from "@/components/ui";

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
    const isCorrect = item.selected_answer !== null && item.is_correct;
    const isAnswered = item.selected_answer !== null;

    return (
      <div className="mx-auto w-full max-w-[800px] space-y-6">
        <Progress
          value={reviewIndex + 1}
          max={review.length}
          label={`Reviewing question ${reviewIndex + 1} of ${review.length}`}
        />
        <p className="text-sm text-text-secondary">
          Question {reviewIndex + 1} of {review.length}
        </p>

        <div className="fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-caption font-semibold tracking-wide text-primary uppercase">
              Question {item.question_order + 1}
            </p>
            <div className="flex items-center gap-2">
              <BookmarkButton mcqId={item.mcq_id} />
              <ReportQuestionButton mcqId={item.mcq_id} />
            </div>
          </div>
          <h2 className="mt-3 text-h2 leading-relaxed font-semibold text-text-primary">
            {item.question}
          </h2>

          <div className="mt-6 space-y-3">
            {item.options.map((option, index) => {
              const isUserAnswer = item.selected_answer === index;
              const isCorrectAnswer = index === item.correct_answer;
              return (
                <div
                  key={index}
                  className={cn(
                    "opt-base p-4 text-base sm:p-5 sm:text-lg",
                    isCorrectAnswer ? "opt-correct" : isUserAnswer ? "opt-wrong" : "opt-neutral"
                  )}
                >
                  <span className="font-semibold">{String.fromCharCode(65 + index)}.</span>{" "}
                  {option}
                  {isCorrectAnswer && (
                    <span className="ml-2 text-caption text-success">Correct answer</span>
                  )}
                  {isUserAnswer && !isCorrectAnswer && (
                    <span className="ml-2 text-caption text-error">Your answer</span>
                  )}
                </div>
              );
            })}
          </div>

          {isAnswered && (
            <div
              className={cn(
                "mt-6 flex items-center gap-2 text-base font-semibold",
                isCorrect ? "text-success" : "text-error"
              )}
              role="status"
            >
              <Icon icon={isCorrect ? CheckCircle2 : XCircle} size="md" />
              {isCorrect ? "Correct" : "Incorrect"}
            </div>
          )}
          <div className="mt-3 border-l-2 border-primary/30 pl-4">
            <p className="text-caption font-semibold tracking-wide text-text-tertiary uppercase">
              Why this is correct
            </p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary sm:text-base">
              {item.explanation}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setReviewIndex((prev) => Math.max(0, prev - 1))}
              disabled={reviewIndex === 0}
            >
              <Icon icon={ArrowLeft} size="sm" />
              Previous
            </Button>
            {reviewIndex < review.length - 1 ? (
              <Button onClick={() => setReviewIndex((prev) => Math.min(review.length - 1, prev + 1))}>
                Next
                <Icon icon={ArrowRight} size="sm" />
              </Button>
            ) : (
              <Button onClick={() => setShowReview(false)}>Back to Results</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card variant="elevated" padding="lg" className="mx-auto w-full max-w-[800px] text-center">
      <div className="flex justify-center">
        <DkBot state={botState} size="medium" alt={null} />
      </div>
      <h2 className="mt-4 text-display font-bold tracking-tight text-text-primary">
        Exam Complete
      </h2>
      <p className="mt-1 text-text-tertiary">Here&apos;s how you performed.</p>

      <div className="mt-5 grid gap-4 text-left sm:grid-cols-2">
        <div className="rounded-card border border-border-default bg-surface p-5">
          <p className="text-sm text-text-tertiary">Total score</p>
          <p className="mt-1 text-h1 font-semibold tabular-nums text-text-primary">
            {correct} <span className="text-lg text-text-tertiary">/ {total}</span>
          </p>
        </div>
        <div className="rounded-card border border-border-default bg-surface p-5">
          <p className="text-sm text-text-tertiary">Percentage</p>
          <p className="mt-1 text-h1 font-semibold tabular-nums text-text-primary">
            {percentage}%
          </p>
        </div>
        <div className="box-success rounded-card p-5">
          <p className="text-sm">Correct</p>
          <p className="mt-1 text-h1 font-semibold tabular-nums">{correct}</p>
        </div>
        <div className="box-error rounded-card p-5">
          <p className="text-sm">Incorrect / Unanswered</p>
          <p className="mt-1 text-h1 font-semibold tabular-nums">{incorrect}</p>
        </div>
      </div>

      {reviewError && (
        <p className="alert-error mt-4 rounded-control px-4 py-3 text-sm">{reviewError}</p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={loadReview} loading={loadingReview}>
          Review Answers
        </Button>
        <Button
          variant="secondary"
          onClick={onStartNew}
          onTouchEnd={(e) => {
            e.preventDefault();
            onStartNew();
          }}
        >
          Start New Exam
        </Button>
      </div>
    </Card>
  );
}
