"use client";

import { useRef } from "react";
import type { MCQ } from "@/types";

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
  const base =
    "w-full rounded-xl p-3 sm:p-4 text-left text-base sm:text-lg transition-all duration-200 disabled:opacity-100";

  if (!answered) {
    return `${base} ${
      selectedAnswer === index
        ? "border border-cyan-300 bg-cyan-400/12 text-[var(--text-selected)] shadow-[0_0_18px_rgba(0,224,255,0.28)] ring-1 ring-cyan-300/45"
        : "border border-cyan-300/20 bg-[var(--bg-card-solid)]/60 text-[var(--text-option)] active:border-cyan-300/55 active:shadow-[0_0_14px_rgba(0,224,255,0.2)]"
    }`;
  }

  if (index === correctAnswer) {
    return `${base} border border-[#39ff90] bg-[#39ff90]/12 text-[#b7ffd9] shadow-[0_0_18px_rgba(57,255,144,0.3)] ring-1 ring-[#39ff90]/60`;
  }

  if (selectedAnswer === index && selectedAnswer !== correctAnswer) {
    return `${base} border border-[#ff4d6d] bg-[#ff4d6d]/12 text-[#ffc3ce] shadow-[0_0_18px_rgba(255,77,109,0.3)] ring-1 ring-[#ff4d6d]/60`;
  }

  return `${base} border border-cyan-300/15 bg-[var(--bg-option)]/50 text-[var(--text-option-dim)]`;
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
      <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-[var(--accent-cyan-strong)]">
        Topic: {mcq.topic}
      </p>
      <h2 className="mt-3 text-xl font-semibold leading-relaxed text-[var(--text-heading)] sm:text-2xl">
        {mcq.question}
      </h2>

      <div className="my-5 border-t border-cyan-300/20" />

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
        <div className="mt-5 rounded-xl border border-violet-300/35 bg-violet-400/10 p-4 fade-in">
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
            className="hud-primary-btn pulse-soft rounded-xl px-5 py-3 text-sm font-medium"
          >
            {isLastQuestion ? "Finish" : "Next Question"}
          </button>
        )}
      </div>
    </section>
  );
}
