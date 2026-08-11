"use client";

import { useEffect, useState } from "react";
import { startExam, getPublishedCount, submitExam } from "@/lib/exam";
import type {
  ExamAnswerSubmission,
  ExamQuestionPayload,
  SubmitExamResponse,
} from "@/types";
import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import ExamSession from "@/components/ExamSession";
import ExamResult from "@/components/ExamResult";

type Phase = "select" | "exam" | "result";

export default function ExamPage() {
  const [phase, setPhase] = useState<Phase>("select");
  const [starting, setStarting] = useState(false);
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [examId, setExamId] = useState<string | null>(null);
  const [examQuestions, setExamQuestions] = useState<
    ExamQuestionPayload[] | null
  >(null);
  const [result, setResult] = useState<SubmitExamResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPublishedCount()
      .then((count) => {
        if (!cancelled) setAvailableCount(count);
      })
      .catch(() => {
        if (!cancelled) setAvailableCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStart = async (count: number) => {
    if (starting) return;
    setError(null);
    setStarting(true);
    try {
      const exam = await startExam({ questionCount: count });
      setExamId(exam.exam_id);
      setExamQuestions(exam.questions);
      setPhase("exam");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start exam");
      setStarting(false);
    }
  };

  const handleSubmit = async (
    answers: (number | null)[],
  ): Promise<SubmitExamResponse> => {
    if (!examId) throw new Error("No exam in progress");
    const submissions: ExamAnswerSubmission[] = (examQuestions ?? []).map(
      (q, index) => ({
        mcq_id: q.mcq_id,
        selected_answer: answers[index],
      }),
    );
    const res = await submitExam(examId, submissions);
    setResult(res);
    setPhase("result");
    return res;
  };

  const handleStartNew = () => {
    setExamId(null);
    setExamQuestions(null);
    setResult(null);
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
                {availableCount === null
                  ? "Loading question bank…"
                  : `${availableCount} questions available. Select the number of questions for your exam.`}
              </p>
              {error && (
                <p className="mt-3 rounded-xl border border-[#ff4d6d]/40 bg-[#ff4d6d]/10 px-4 py-3 text-sm text-[#ffc3ce]">
                  {error}
                </p>
              )}
              <div className="mt-6 flex flex-col gap-3">
                {[20, 50, 100].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleStart(n)}
                    disabled={starting}
                    className="hud-primary-btn rounded-xl px-6 py-4 text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {starting ? "Starting…" : `${n} Questions`}
                  </button>
                ))}
              </div>
            </section>
          )}

          {phase === "exam" && examQuestions && examId && (
            <ExamSession questions={examQuestions} onSubmit={handleSubmit} />
          )}

          {phase === "result" && result && examId && (
            <ExamResult
              examId={examId}
              result={result}
              onStartNew={handleStartNew}
            />
          )}
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}