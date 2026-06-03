"use client";

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
        ? "border border-cyan-300 bg-cyan-400/12 text-[#ecfbff] shadow-[0_0_18px_rgba(0,224,255,0.28)] ring-1 ring-cyan-300/45"
        : "border border-cyan-300/20 bg-[#101a31]/60 text-[#cfe2ff] active:border-cyan-300/55 active:shadow-[0_0_14px_rgba(0,224,255,0.2)]"
    }`;
  }

  if (index === correctAnswer) {
    return `${base} border border-[#39ff90] bg-[#39ff90]/12 text-[#b7ffd9] shadow-[0_0_18px_rgba(57,255,144,0.3)] ring-1 ring-[#39ff90]/60`;
  }

  if (selectedAnswer === index && selectedAnswer !== correctAnswer) {
    return `${base} border border-[#ff4d6d] bg-[#ff4d6d]/12 text-[#ffc3ce] shadow-[0_0_18px_rgba(255,77,109,0.3)] ring-1 ring-[#ff4d6d]/60`;
  }

  return `${base} border border-cyan-300/15 bg-[#0f1730]/50 text-[#8299bc]`;
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
  return (
    <section className="hud-card fade-in rounded-xl p-5 sm:p-6">
      <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
        Topic: {mcq.topic}
      </p>
      <h2 className="mt-3 text-xl font-semibold leading-relaxed text-[#f2f8ff] sm:text-2xl">
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
            onClick={() => onSelect(index)}
            onTouchEnd={(e) => {
              if (!answered) { e.preventDefault(); onSelect(index); }
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
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-200">
            Explanation
          </p>
          <p className="mt-1 text-sm text-[#d4e4ff] sm:text-base">{mcq.explanation}</p>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        {!answered ? (
          <button
            type="button"
            onClick={onSubmit}
            onTouchEnd={(e) => {
              if (selectedAnswer !== null && !answered) { e.preventDefault(); onSubmit(); }
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
            onTouchEnd={(e) => { e.preventDefault(); onNext(); }}
            className="hud-primary-btn pulse-soft rounded-xl px-5 py-3 text-sm font-medium"
          >
            {isLastQuestion ? "Finish" : "Next Question"}
          </button>
        )}
      </div>
    </section>
  );
}
