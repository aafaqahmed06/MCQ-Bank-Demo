import { createClient } from "@/lib/supabase/client";
import type { MCQ } from "@/types";

/** Raw shape returned by the get_smart_practice_questions RPC. */
interface SmartPracticeQuestionRow {
  mcq_id: string;
  topic_id: string;
  topic: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: number;
  topic_weight?: number;
  question_weight?: number;
}

interface SmartPracticeResponse {
  questions: SmartPracticeQuestionRow[];
  topics_included: number;
  generated_at: string;
}

export interface SmartPracticeResult {
  questions: MCQ[];
  topicsIncluded: number;
}

function toMCQ(row: SmartPracticeQuestionRow): MCQ {
  return {
    id: row.mcq_id,
    // Smart Practice spans multiple modules/blocks by design -- these
    // fields are unused by MCQCard/BookmarkButton/ReportQuestionButton
    // (they only need mcq.id), so a single-topic block/module id would be
    // misleading here.
    blockId: "",
    moduleId: "",
    topic: row.topic,
    question: row.question,
    options: row.options,
    correctAnswer: row.correct_answer,
    explanation: row.explanation,
    difficulty: row.difficulty,
  };
}

/**
 * Cross-topic "Smart Practice" retrieval -- does not require a topic_id up
 * front. Mixes questions across the student's topics, weighted toward
 * their weakest ones (see get_smart_practice_questions in
 * supabase/migrations/20260708000030_smart_practice.sql for the ranking).
 */
export async function getSmartPracticeQuestions(options?: {
  questionCount?: number;
  difficulty?: number[];
}): Promise<SmartPracticeResult> {
  const { data, error } = await createClient().rpc("get_smart_practice_questions", {
    p_question_count: options?.questionCount ?? 20,
    p_difficulty: options?.difficulty ?? [1, 2, 3],
  });
  if (error) throw new Error(`get_smart_practice_questions: ${error.message}`);

  const res = data as SmartPracticeResponse;
  return {
    questions: (res.questions ?? []).map(toMCQ),
    topicsIncluded: res.topics_included,
  };
}
