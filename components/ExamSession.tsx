"use client";

import { useRef, useState } from "react";
import type { ExamQuestionPayload, SubmitExamResponse } from "@/types";

type ExamSessionProps = {
  questions: ExamQuestionPayload[];
  onSubmit: (answers: (number | null)[]) => Promise<SubmitExamResponse>;
};

export default function ExamSession({
  questions,
  onSubmit,
}: ExamSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(questions.length).fill(null)
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const touchStartY = useRef(0);

  const total = questions.length;
  const currentQuestion = questions[currentIndex];
  const answeredCount = answers.filter((a) => a !== null).length;

  const handleNext = async () => {
    if (selectedAnswer === null || submitting) return;

    const newAnswers = [...answers];
    newAnswers[currentIndex] = selectedAnswer;
    setAnswers(newAnswers);

    if (currentIndex === total - 1) {
      setSubmitting(true);
      setSubmitError(null);
      try {
        await onSubmit(newAnswers);
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Failed to submit exam"
        );
        setSubmitting(false);
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="hud-card rounded-xl p-4">
        <div className="flex items-center justify-between gap-4 text-sm text-[var(--text-muted-light)]">
          <p>
            Question {currentIndex + 1} of {total}
          </p>
          <p>Answered: {answeredCount}</p>
        </div>
        <div className="mt-3 h-2 rounded-full bg-[var(--bg-progress-track)]">
          <div
            className="h-2 rounded-full bg-cyan-300 transition-all duration-300 shadow-[0_0_14px_rgba(0,224,255,0.35)]"
            style={{ width: `${(answeredCount / total) * 100}%` }}
          />
        </div>
      </div>

      <section className="hud-card fade-in rounded-xl p-5 sm:p-6">
        {currentQuestion.topic && (
          <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-[var(--accent-cyan-strong)]">
            Topic: {currentQuestion.topic}
          </p>
        )}
        <h2 className="mt-3 text-xl font-semibold leading-relaxed text-[var(--text-heading)] sm:text-2xl">
          {currentQuestion.question}
        </h2>

        <div className="my-5 border-t border-cyan-300/20" />

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              type="button"
              className={`w-full rounded-xl p-3 sm:p-4 text-left text-base sm:text-lg transition-all duration-200 ${
                selectedAnswer === index
                  ? "border border-cyan-300 bg-cyan-400/12 text-[var(--text-selected)] shadow-[0_0_18px_rgba(0,224,255,0.28)] ring-1 ring-cyan-300/45"
                  : "border border-cyan-300/20 bg-[var(--bg-card-solid)]/60 text-[var(--text-option)] active:border-cyan-300/55 active:shadow-[0_0_14px_rgba(0,224,255,0.2)]"
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
          <p className="mt-4 rounded-xl border border-[#ff4d6d]/40 bg-[#ff4d6d]/10 px-4 py-3 text-sm text-[#ffc3ce]">
            {submitError}
          </p>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleNext}
            onTouchStart={(e) => {
              touchStartY.current = e.changedTouches[0].clientY;
            }}
            onTouchEnd={(e) => {
              const dy = Math.abs(
                e.changedTouches[0].clientY - touchStartY.current
              );
              if (selectedAnswer !== null && !submitting && dy < 10) {
                e.preventDefault();
                handleNext();
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