import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getPracticeQuestions } from "@/lib/curriculum";
import type { MCQ } from "@/types";
import {
  computeQuestionWeights,
  splitReservedAndRemainder,
  type AttemptStats,
  type QuestionWeight,
} from "@/lib/practiceRankingCore";

export * from "@/lib/practiceRankingCore";

/**
 * Reuses getPracticeQuestions() for the candidate pool unchanged, merges
 * this user's practice_attempts + exam_answers for those mcq ids into
 * AttemptStats, and returns a guaranteed-slot ordering (see
 * splitReservedAndRemainder in lib/practiceRankingCore.ts) plus the full
 * weight breakdown (never opaque -- debuggable).
 */
export async function getWeightedPracticeQuestions(
  moduleId: string,
  topicNames?: string[],
): Promise<{ questions: MCQ[]; weights: QuestionWeight[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { questions: [], weights: [] };

  const questions = await getPracticeQuestions(moduleId, topicNames);
  if (questions.length === 0) return { questions: [], weights: [] };

  const mcqIds = questions.map((q) => q.id);

  const [{ data: practiceRows }, { data: examRows }] = await Promise.all([
    supabase
      .from("practice_attempts")
      .select("mcq_id, is_correct, attempted_at")
      .in("mcq_id", mcqIds),
    supabase
      .from("exam_answers")
      .select("mcq_id, is_correct, answered_at")
      .in("mcq_id", mcqIds)
      .not("is_correct", "is", null),
  ]);

  const statsByMcq = new Map<string, AttemptStats>();
  const fold = (mcqId: string, isCorrect: boolean, ts: string | null) => {
    const existing = statsByMcq.get(mcqId) ?? {
      mcqId,
      attempts: 0,
      misses: 0,
      lastAttemptedAt: null,
    };
    existing.attempts += 1;
    if (!isCorrect) existing.misses += 1;
    if (ts && (!existing.lastAttemptedAt || ts > existing.lastAttemptedAt)) {
      existing.lastAttemptedAt = ts;
    }
    statsByMcq.set(mcqId, existing);
  };

  for (const row of practiceRows ?? []) {
    fold(row.mcq_id as string, row.is_correct as boolean, row.attempted_at as string | null);
  }
  for (const row of examRows ?? []) {
    fold(row.mcq_id as string, row.is_correct as boolean, row.answered_at as string | null);
  }

  const weights = computeQuestionWeights(mcqIds, statsByMcq);
  const weightMap = new Map(weights.map((w) => [w.mcqId, w.finalWeight]));
  const orderedQuestions = splitReservedAndRemainder(questions, weightMap, weights);

  return { questions: orderedQuestions, weights };
}
