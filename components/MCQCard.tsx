"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import type { MCQ } from "@/types";
import BookmarkButton, { type BookmarkButtonHandle } from "@/components/BookmarkButton";
import ReportQuestionButton, {
  type ReportQuestionButtonHandle,
} from "@/components/ReportQuestionButton";
import { Button, Icon, cn } from "@/components/ui";

type MCQCardProps = {
  mcq: Pick<MCQ, "id" | "topic" | "question" | "options" | "correctAnswer" | "explanation">;
  selectedAnswer: number | null;
  answered: boolean;
  onSelect: (index: number) => void;
  onSubmit: () => void;
  /** Omit when there's nothing to advance to (e.g. a standalone sample
   * question) -- hides the post-answer Next/Finish button, its keyboard
   * shortcut, and the corresponding hint text. */
  onNext?: () => void;
  onBookmarkToggle?: (bookmarked: boolean) => void;
  isLastQuestion?: boolean;
  /** Default true. Set false where the viewer isn't authenticated (e.g. the
   * public landing page sample) -- bookmarking/reporting require a session. */
  enableBookmarkAndReport?: boolean;
  /** Reflects a pending answer-check (e.g. a server round trip) on the
   * Submit button, for callers that don't grade locally. */
  submitLoading?: boolean;
};

function getOptionClasses(
  index: number,
  selectedAnswer: number | null,
  answered: boolean,
  correctAnswer: number
) {
  const base =
    "opt-base p-4 sm:p-5 text-base sm:text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  if (!answered) {
    return cn(base, selectedAnswer === index && "opt-selected");
  }

  if (index === correctAnswer) {
    return cn(base, "opt-correct");
  }

  if (selectedAnswer === index && selectedAnswer !== correctAnswer) {
    return cn(base, "opt-wrong");
  }

  return cn(base, "opt-neutral");
}

// This app has no editable text field on the practice screen, but the
// report modal does (a textarea) -- shortcuts must never fire while it's open.
function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export default function MCQCard({
  mcq,
  selectedAnswer,
  answered,
  onSelect,
  onSubmit,
  onNext,
  onBookmarkToggle,
  isLastQuestion = false,
  enableBookmarkAndReport = true,
  submitLoading = false,
}: MCQCardProps) {
  const touchStartY = useRef(0);
  const bookmarkRef = useRef<BookmarkButtonHandle>(null);
  const reportRef = useRef<ReportQuestionButtonHandle>(null);
  const isCorrect = answered && selectedAnswer === mcq.correctAnswer;

  // Keyboard shortcuts (§ MCQ interface): A-E select, Enter submit/next,
  // -> next question, B bookmark, R report.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (enableBookmarkAndReport && key === "b") {
        e.preventDefault();
        bookmarkRef.current?.toggle();
        return;
      }
      if (enableBookmarkAndReport && key === "r") {
        e.preventDefault();
        reportRef.current?.open();
        return;
      }

      if (!answered) {
        const optionIndex = "abcde".indexOf(key);
        if (optionIndex !== -1 && optionIndex < mcq.options.length) {
          e.preventDefault();
          onSelect(optionIndex);
          return;
        }
        if (key === "enter" && selectedAnswer !== null) {
          e.preventDefault();
          onSubmit();
        }
      } else if (onNext && (key === "enter" || e.key === "ArrowRight")) {
        e.preventDefault();
        onNext();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [answered, selectedAnswer, mcq.options.length, onSelect, onSubmit, onNext, enableBookmarkAndReport]);

  return (
    <div className="fade-in mx-auto w-full max-w-[800px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption font-semibold tracking-wide text-primary uppercase">
          {mcq.topic}
        </p>
        {enableBookmarkAndReport && (
          <div className="flex items-center gap-2">
            <BookmarkButton ref={bookmarkRef} mcqId={mcq.id} onToggle={onBookmarkToggle} />
            <ReportQuestionButton ref={reportRef} mcqId={mcq.id} />
          </div>
        )}
      </div>

      <h2 className="mt-4 text-h2 leading-relaxed font-semibold text-text-primary">
        {mcq.question}
      </h2>

      <div className="mt-6 space-y-3">
        {mcq.options.map((option, index) => (
          <button
            key={`${mcq.id}-${index}`}
            type="button"
            className={getOptionClasses(index, selectedAnswer, answered, mcq.correctAnswer)}
            onClick={() => {
              if (Math.abs(touchStartY.current) < 10) onSelect(index);
              touchStartY.current = 0;
            }}
            onTouchStart={(e) => {
              touchStartY.current = e.changedTouches[0].clientY;
            }}
            onTouchEnd={(e) => {
              const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
              if (!answered && dy < 10) {
                e.preventDefault();
                onSelect(index);
              }
              touchStartY.current = 0;
            }}
            disabled={answered}
          >
            <span className="flex items-center gap-2">
              <span className="flex-1">
                <span className="font-semibold">{String.fromCharCode(65 + index)}.</span> {option}
              </span>
              {answered && index === mcq.correctAnswer && (
                <Icon icon={CheckCircle2} size="sm" className="shrink-0 text-success" />
              )}
              {answered && selectedAnswer === index && selectedAnswer !== mcq.correctAnswer && (
                <Icon icon={XCircle} size="sm" className="shrink-0 text-error" />
              )}
            </span>
          </button>
        ))}
      </div>

      {answered && (
        <div className="fade-in mt-6">
          <div
            className={cn(
              "flex items-center gap-2 text-base font-semibold",
              isCorrect ? "text-success" : "text-error"
            )}
            role="status"
          >
            <Icon icon={isCorrect ? CheckCircle2 : XCircle} size="md" />
            {isCorrect ? "Correct" : "Incorrect"}
          </div>
          <div className="mt-3 border-l-2 border-primary/30 pl-4">
            <p className="text-caption font-semibold tracking-wide text-text-tertiary uppercase">
              Why this is correct
            </p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary sm:text-base">
              {mcq.explanation}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="hidden text-caption text-text-tertiary sm:block">
          {!answered
            ? `A–E select · Enter submit${enableBookmarkAndReport ? " · B bookmark" : ""}`
            : onNext
              ? "Enter or → next question"
              : ""}
        </p>
        {!answered ? (
          <Button
            onClick={onSubmit}
            onTouchStart={(e) => {
              touchStartY.current = e.changedTouches[0].clientY;
            }}
            onTouchEnd={(e) => {
              const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
              if (selectedAnswer !== null && !answered && dy < 10) {
                e.preventDefault();
                onSubmit();
              }
              touchStartY.current = 0;
            }}
            disabled={selectedAnswer === null || submitLoading}
            loading={submitLoading}
          >
            Submit Answer
          </Button>
        ) : (
          onNext && (
            <Button
              onClick={onNext}
              onTouchStart={(e) => {
                touchStartY.current = e.changedTouches[0].clientY;
              }}
              onTouchEnd={(e) => {
                const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
                if (dy < 10) {
                  e.preventDefault();
                  onNext();
                }
                touchStartY.current = 0;
              }}
            >
              {isLastQuestion ? "Finish" : "Next Question"}
              <Icon icon={ArrowRight} size="sm" />
            </Button>
          )
        )}
      </div>
    </div>
  );
}
