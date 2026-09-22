"use client";

import { useState } from "react";
import type { SampleQuestion } from "@/types";
import { checkSampleAnswer } from "@/app/actions";
import MCQCard from "@/components/MCQCard";
import DkBot from "@/components/DkBot";

type Revealed = { correctAnswer: number; explanation: string; isCorrect: boolean };

/**
 * Interactive sample question for the (signed-out) landing page. Answering
 * it never reaches any scored-attempt path -- checkSampleAnswer (app/actions.ts)
 * only reads the mcq's answer key and returns it; nothing is inserted or
 * updated, and none of record_practice_attempt/record_practice_completion/
 * start_exam/submit_exam are ever called. correctAnswer/explanation are kept
 * out of the client until after an answer is submitted, since this page is
 * fully public (unlike authenticated practice, which already has the full
 * MCQ server-side before answering).
 */
export default function LandingSampleQuestion({ sample }: { sample: SampleQuestion }) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [revealed, setRevealed] = useState<Revealed | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (selectedAnswer === null || checking) return;
    setChecking(true);
    setError(null);
    const result = await checkSampleAnswer(sample.id, selectedAnswer);
    setChecking(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRevealed({
      correctAnswer: result.correctAnswer,
      isCorrect: result.isCorrect,
      explanation: result.explanation,
    });
  }

  const mcqForCard = {
    id: sample.id,
    topic: sample.topic ? `Sample question · ${sample.topic}` : "Sample question",
    question: sample.question,
    options: sample.options,
    correctAnswer: revealed?.correctAnswer ?? -1,
    explanation: revealed?.explanation ?? "",
  };

  return (
    <div className="mt-14 w-full max-w-xl md:mt-20">
      <MCQCard
        mcq={mcqForCard}
        selectedAnswer={selectedAnswer}
        answered={revealed !== null}
        onSelect={setSelectedAnswer}
        onSubmit={handleSubmit}
        enableBookmarkAndReport={false}
        submitLoading={checking}
      />

      {error && (
        <p className="alert-error mt-3 rounded-control px-3 py-2 text-center text-sm" role="alert">
          {error}
        </p>
      )}

      {revealed && (
        <div className="fade-in mt-4 flex items-center justify-center gap-3">
          <DkBot state={revealed.isCorrect ? "celebrating" : "concerned"} size="small" alt={null} />
          <p className="text-sm text-text-secondary">
            {revealed.isCorrect
              ? "Nice — that's exactly it."
              : "Close! That's exactly what practice is for."}
          </p>
        </div>
      )}
    </div>
  );
}
