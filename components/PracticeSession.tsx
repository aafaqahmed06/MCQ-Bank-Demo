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

export default function PracticeSession({
  questions,
  backHref,
}: PracticeSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  const shuffled = useMemo(() => {
    const arr = [...questions];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [questions]);

  const currentQuestion = shuffled[currentIndex];
  const totalQuestions = shuffled.length;
  const completed = finished;

  const progressCurrent = useMemo(() => {
    if (completed) {
      return totalQuestions;
    }
    return currentIndex + 1;
  }, [completed, currentIndex, totalQuestions]);

  const handleSubmit = () => {
    if (selectedAnswer === null || answered) {
      return;
    }

    setAnswered(true);

    if (selectedAnswer === currentQuestion.correctAnswer) {
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
  };

  return (
    <div className="space-y-6">
      <QuestionProgress current={progressCurrent} total={totalQuestions} score={score} />

      {completed ? (
        <ResultSummary
          correct={score}
          total={totalQuestions}
          onRestart={handleRestart}
          backHref={backHref}
        />
      ) : (
        <MCQCard
          mcq={currentQuestion}
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
