"use client";

import { useState } from "react";
import { mcqs } from "@/lib/data/mcqs";
import type { MCQ } from "@/types";
import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import ExamSession from "@/components/ExamSession";
import ExamResult from "@/components/ExamResult";

function fisherYates<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function prepareQuestions(count: number): MCQ[] {
  const available = [...mcqs];
  fisherYates(available);
  const selected = available.slice(0, Math.min(count, available.length));

  return selected.map((q) => {
    const indices = q.options.map((_, i) => i);
    fisherYates(indices);
    return {
      ...q,
      options: indices.map((i) => q.options[i]),
      correctAnswer: indices.indexOf(q.correctAnswer),
    };
  });
}

type Phase = "select" | "exam" | "result";

export default function ExamPage() {
  const [phase, setPhase] = useState<Phase>("select");
  const [examQuestions, setExamQuestions] = useState<MCQ[] | null>(null);
  const [examAnswers, setExamAnswers] = useState<(number | null)[] | null>(
    null
  );

  const handleStart = (count: number) => {
    setExamQuestions(prepareQuestions(count));
    setPhase("exam");
  };

  const handleFinish = (answers: (number | null)[]) => {
    setExamAnswers(answers);
    setPhase("result");
  };

  const handleStartNew = () => {
    setExamQuestions(null);
    setExamAnswers(null);
    setPhase("select");
  };

  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="space-y-6">
          {phase === "select" && (
            <section className="hud-card fade-in mx-auto w-full max-w-lg rounded-xl p-6 sm:p-8 text-center">
              <h1 className="text-3xl font-bold text-[var(--text-heading)]">
                Exam Simulation
              </h1>
              <p className="mt-2 text-[var(--text-muted)]">
                {mcqs.length} questions available. Select the number of
                questions for your exam.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                {[50, 100, 150].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleStart(n)}
                    className="hud-primary-btn rounded-xl px-6 py-4 text-lg font-semibold"
                  >
                    {n} Questions
                  </button>
                ))}
              </div>
            </section>
          )}

          {phase === "exam" && examQuestions && (
            <ExamSession questions={examQuestions} onFinish={handleFinish} />
          )}

          {phase === "result" && examQuestions && examAnswers && (
            <ExamResult
              questions={examQuestions}
              answers={examAnswers}
              onStartNew={handleStartNew}
            />
          )}
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}
