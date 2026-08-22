"use client";

import { useMemo, useState } from "react";
import type { MCQ } from "@/types";
import MCQCard from "@/components/MCQCard";
import QuestionProgress from "@/components/QuestionProgress";
import ResultSummary from "@/components/ResultSummary";
import { createClient } from "@/lib/supabase/client";

type PracticeSessionProps = {
  questions: MCQ[];
  backHref: string;
  /** Module the practice session belongs to. */
  completionModuleId?: string;
  /** Topic IDs flagged as completed when the session finishes. */
  completionTopicIds?: string[];
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
  completionModuleId,
  completionTopicIds,
}: PracticeSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [restartCount, setRestartCount] = useState(0);

  // `questions` arrives in a deliberately weighted order (miss rate +
  // recency, see lib/practiceRanking.ts) -- it must NOT be reshuffled
  // client-side, or the ranking is erased before the student ever sees it.
  const orderedQuestions = questions;

  const displayedQuestion = useMemo(() => {
    const q = orderedQuestions[currentIndex];
    const indices = shuffle(q.options.map((_, i) => i));
    return {
      ...q,
      options: indices.map((i) => q.options[i]),
      correctAnswer: indices.indexOf(q.correctAnswer),
      // Inverse mapping back to the original (unshuffled) option space, so
      // a selected answer can be reported to record_practice_attempt in
      // the space mcqs.correct_answer is actually expressed in.
      optionIndices: indices,
    };
    // restartCount forces a fresh option shuffle on each restart even
    // though orderedQuestions/currentIndex are unchanged.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedQuestions, currentIndex, restartCount]);

  const totalQuestions = orderedQuestions.length;
  const completed = finished;

  const answeredCount = useMemo(() => {
    if (finished) return totalQuestions;
    if (answered) return currentIndex + 1;
    return currentIndex;
  }, [finished, answered, currentIndex, totalQuestions]);

  const recordAttempt = async (mcqId: string, selectedOptionIndex: number) => {
    try {
      await createClient().rpc("record_practice_attempt", {
        p_mcq_id: mcqId,
        p_selected_option_index: selectedOptionIndex,
      });
    } catch {
      // Non-fatal: don't interrupt the session on a sync failure.
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer === null || answered) {
      return;
    }

    setAnswered(true);

    if (selectedAnswer === displayedQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }

    // p_selected_option_index must be in the original (unshuffled) option
    // space -- selectedAnswer is in shuffled-option space.
    void recordAttempt(displayedQuestion.id, displayedQuestion.optionIndices[selectedAnswer]);
  };

  const recordCompletion = async () => {
    if (!completionModuleId || !completionTopicIds || completionTopicIds.length === 0) {
      return;
    }
    try {
      await createClient().rpc("record_practice_completion", {
        p_module_id: completionModuleId,
        p_topic_ids: completionTopicIds,
      });
    } catch {
      // Non-fatal: don't interrupt the finished state on a sync failure.
    }
  };

  const handleNext = () => {
    if (!answered) {
      return;
    }

    const isLastQuestion = currentIndex === totalQuestions - 1;
    if (isLastQuestion) {
      setFinished(true);
      void recordCompletion();
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
