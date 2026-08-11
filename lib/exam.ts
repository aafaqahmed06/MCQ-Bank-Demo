import { createClient } from "@/lib/supabase/client";
import type {
  ExamAnswerSubmission,
  ExamReviewItem,
  StartExamResponse,
  SubmitExamResponse,
} from "@/types";

/**
 * Starts an exam on the server. Returns only key-free question payloads;
 * the option permutation and correct answer never leave the server.
 */
export async function startExam(options: {
  topicIds?: string[];
  difficulty?: number[];
  questionCount: number;
  timeLimitSeconds?: number;
}): Promise<StartExamResponse> {
  const { data, error } = await createClient().rpc("start_exam", {
    p_topic_ids: options.topicIds ?? null,
    p_difficulty: options.difficulty ?? [1, 2, 3],
    p_question_count: options.questionCount,
    p_time_limit_seconds: options.timeLimitSeconds ?? null,
  });
  if (error) throw new Error(`start_exam: ${error.message}`);
  return data as StartExamResponse;
}

/** Submits answers and grades atomically server-side. */
export async function submitExam(
  examId: string,
  answers: ExamAnswerSubmission[],
): Promise<SubmitExamResponse> {
  const { data, error } = await createClient().rpc("submit_exam", {
    p_exam_id: examId,
    p_answers: answers,
  });
  if (error) throw new Error(`submit_exam: ${error.message}`);
  return data as SubmitExamResponse;
}

/** Fetches the answer-key review. Only valid after the exam is submitted. */
export async function getExamReview(examId: string): Promise<ExamReviewItem[]> {
  const { data, error } = await createClient().rpc("get_exam_review", {
    p_exam_id: examId,
  });
  if (error) throw new Error(`get_exam_review: ${error.message}`);
  return (data ?? []) as ExamReviewItem[];
}

/** Count of published questions visible to the current client (RLS-filtered). */
export async function getPublishedCount(): Promise<number> {
  const { count, error } = await createClient()
    .from("mcqs")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(`count mcqs: ${error.message}`);
  return count ?? 0;
}