"use client";

import { useMemo, useState } from "react";
import type { MCQ } from "@/types";
import MCQCard from "@/components/MCQCard";
import QuestionProgress from "@/components/QuestionProgress";
import ResultSummary from "@/components/ResultSummary";

type PracticeSessionProps = {
  questions: MCQ[];
  backHref: string;
};

function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function PracticeSession({
  questions,
  backHref,
}: PracticeSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [restartCount, setRestartCount] = useState(0);

  const shuffled = useMemo(
    () => shuffle(questions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questions, restartCount],
  );

  const displayedQuestion = useMemo(() => {
    const q = shuffled[currentIndex];
    const indices = shuffle(q.options.map((_, i) => i));
    return {
      ...q,
      options: indices.map((i) => q.options[i]),
      correctAnswer: indices.indexOf(q.correctAnswer),
    };
  }, [shuffled, currentIndex]);

  const totalQuestions = shuffled.length;
  const completed = finished;

  const answeredCount = useMemo(() => {
    if (finished) return totalQuestions;
    if (answered) return currentIndex + 1;
    return currentIndex;
  }, [finished, answered, currentIndex, totalQuestions]);

  const handleSubmit = () => {
    if (selectedAnswer === null || answered) {
      return;
    }

    setAnswered(true);

    if (selectedAnswer === displayedQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (!answered) {
      return;
    }

    const isLastQuestion = currentIndex === totalQuestions - 1;
    if (isLastQuestion) {
      setFinished(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setAnswered(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setFinished(false);
    setScore(0);
    setRestartCount((c) => c + 1);
  };

  return (
    <div className="space-y-6">
      <QuestionProgress
        current={currentIndex + 1}
        answered={answeredCount}
        total={totalQuestions}
        score={score}
      />

      {completed ? (
        <ResultSummary
          correct={score}
          total={totalQuestions}
          onRestart={handleRestart}
          backHref={backHref}
        />
      ) : (
        <MCQCard
          mcq={displayedQuestion}
          selectedAnswer={selectedAnswer}
          answered={answered}
          onSelect={setSelectedAnswer}
          onSubmit={handleSubmit}
          onNext={handleNext}
          isLastQuestion={currentIndex === totalQuestions - 1}
        />
      )}
    </div>
  );
}
