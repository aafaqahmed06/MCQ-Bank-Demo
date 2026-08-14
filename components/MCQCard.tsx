"use client";

import { useRef } from "react";
import type { MCQ } from "@/types";
import BookmarkButton from "@/components/BookmarkButton";
import ReportQuestionButton from "@/components/ReportQuestionButton";

type MCQCardProps = {
  mcq: MCQ;
  selectedAnswer: number | null;
  answered: boolean;
  onSelect: (index: number) => void;
  onSubmit: () => void;
  onNext: () => void;
  isLastQuestion: boolean;
};

function getOptionClasses(
  index: number,
  selectedAnswer: number | null,
  answered: boolean,
  correctAnswer: number
) {
  const base = "opt-base p-3 sm:p-4 text-base sm:text-lg";

  if (!answered) {
    return `${base} ${
      selectedAnswer === index ? "opt-selected" : ""
    }`;
  }

  if (index === correctAnswer) {
    return `${base} opt-correct`;
  }

  if (selectedAnswer === index && selectedAnswer !== correctAnswer) {
    return `${base} opt-wrong`;
  }

  return `${base} opt-neutral`;
}

export default function MCQCard({
  mcq,
  selectedAnswer,
  answered,
  onSelect,
  onSubmit,
  onNext,
  isLastQuestion,
}: MCQCardProps) {
  const touchStartY = useRef(0);

  return (
    <section className="hud-card fade-in rounded-xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-[var(--accent-cyan-strong)]">
          Topic: {mcq.topic}
        </p>
        <div className="flex items-center gap-2">
          <BookmarkButton mcqId={mcq.id} />
          <ReportQuestionButton mcqId={mcq.id} />
        </div>
      </div>
      <h2 className="mt-4 text-xl font-semibold leading-relaxed text-[var(--text-heading)] sm:text-2xl">
        {mcq.question}
      </h2>

      <div className="my-5 border-t border-[var(--border-color)]" />

      <div className="space-y-3">
        {mcq.options.map((option, index) => (
          <button
            key={`${mcq.id}-${index}`}
            type="button"
            className={getOptionClasses(
              index,
              selectedAnswer,
              answered,
              mcq.correctAnswer
            )}
            onClick={() => {
              if (Math.abs(touchStartY.current) < 10) onSelect(index);
              touchStartY.current = 0;
            }}
            onTouchStart={(e) => { touchStartY.current = e.changedTouches[0].clientY; }}
            onTouchEnd={(e) => {
              const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
              if (!answered && dy < 10) { e.preventDefault(); onSelect(index); }
              touchStartY.current = 0;
            }}
            disabled={answered}
          >
            <span className="font-semibold">{String.fromCharCode(65 + index)}.</span>{" "}
            {option}
          </button>
        ))}
      </div>

      {answered && (
        <div className="mt-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] p-4 fade-in">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-violet)]">
            Explanation
          </p>
          <p className="mt-1 text-sm text-[var(--text-body-alt)] sm:text-base">{mcq.explanation}</p>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        {!answered ? (
          <button
            type="button"
            onClick={onSubmit}
            onTouchStart={(e) => { touchStartY.current = e.changedTouches[0].clientY; }}
            onTouchEnd={(e) => {
              const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
              if (selectedAnswer !== null && !answered && dy < 10) { e.preventDefault(); onSubmit(); }
              touchStartY.current = 0;
            }}
            disabled={selectedAnswer === null}
            className="hud-primary-btn rounded-xl px-5 py-3 text-sm font-medium disabled:cursor-not-allowed"
          >
            Submit Answer
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            onTouchStart={(e) => { touchStartY.current = e.changedTouches[0].clientY; }}
            onTouchEnd={(e) => {
              const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
              if (dy < 10) { e.preventDefault(); onNext(); }
              touchStartY.current = 0;
            }}
            className="hud-primary-btn rounded-xl px-5 py-3 text-sm font-medium"
          >
            {isLastQuestion ? "Finish" : "Next Question"}
          </button>
        )}
      </div>
    </section>
  );
}