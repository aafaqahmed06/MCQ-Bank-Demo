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
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  const currentQuestion = questions[currentIndex];
  const completed = totalAnswered === questions.length;

  const progressCurrent = useMemo(() => {
    if (completed) {
      return questions.length;
    }
    return currentIndex + 1;
  }, [completed, currentIndex, questions.length]);

  const handleSubmit = () => {
    if (selectedAnswer === null || answered) {
      return;
    }

    setAnswered(true);
    setTotalAnswered((prev) => prev + 1);

    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (!answered) {
      return;
    }

    const isLastQuestion = currentIndex === questions.length - 1;
    if (isLastQuestion) {
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
    setScore(0);
    setTotalAnswered(0);
  };

  return (
    <div className="space-y-6">
      <QuestionProgress current={progressCurrent} total={questions.length} score={score} />

      {completed ? (
        <ResultSummary
          correct={score}
          total={questions.length}
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
          isLastQuestion={currentIndex === questions.length - 1}
        />
      )}
    </div>
  );
}
