"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type CheckSampleAnswerResult =
  | { ok: true; isCorrect: boolean; correctAnswer: number; explanation: string }
  | { ok: false; error: string };

/**
 * Grades the public landing-page sample question. Read-only by design: a
 * single select on mcqs, nothing else. Never call record_practice_attempt,
 * record_practice_completion, start_exam, or submit_exam here, and never
 * insert/update practice_attempts, user_topic_progress, exams, or
 * exam_answers -- those are the only tables/RPCs any real, scored answer
 * submission ever touches, and this sample question must never count as one.
 */
export async function checkSampleAnswer(
  mcqId: string,
  selectedIndex: number
): Promise<CheckSampleAnswerResult> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("mcqs")
    .select("correct_answer, explanation")
    .eq("id", mcqId)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Couldn't check that answer. Please try again." };
  }

  const correctAnswer = data.correct_answer as number;
  return {
    ok: true,
    isCorrect: selectedIndex === correctAnswer,
    correctAnswer,
    explanation: data.explanation as string,
  };
}
