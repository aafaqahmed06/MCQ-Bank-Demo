import { createClient } from "@/lib/supabase/client";
import type { MCQ } from "@/types";

/**
 * Minimum combined practice_attempts + exam_answers history required
 * before Smart Practice is offered. Below this, every topic/question has
 * error_rate = null and _question_weakness_weight() falls back to the same
 * flat BASE_WEIGHT + NOVELTY_BONUS for everything -- the resulting mix
 * would look personalized ("weighted toward your weakest topics") without
 * actually being weighted by anything real. Enforced server-side inside
 * get_smart_practice_questions (supabase/migrations/
 * 20260708000033_smart_practice_eligibility.sql) -- this constant is passed
 * explicitly on every call so the UI and the enforced gate always agree,
 * rather than relying on the SQL default staying in sync silently.
 */
export const SMART_PRACTICE_MIN_ATTEMPTS = 25;

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
  eligible: boolean;
  attempts: number;
  min_attempts: number;
  questions: SmartPracticeQuestionRow[];
  topics_included: number;
  generated_at: string;
}

export interface SmartPracticeResult {
  eligible: boolean;
  attempts: number;
  minAttempts: number;
  questions: MCQ[];
  topicsIncluded: number;
}

export interface SmartPracticeEligibility {
  eligible: boolean;
  attempts: number;
  minAttempts: number;
}

interface EligibilityResponse {
  eligible: boolean;
  attempts: number;
  min_attempts: number;
}

/**
 * Lightweight eligibility check -- call this to show a progress indicator
 * before the student starts a session, without paying for
 * get_smart_practice_questions' candidate-pool construction.
 */
export async function getSmartPracticeEligibility(): Promise<SmartPracticeEligibility> {
  const { data, error } = await createClient().rpc("get_smart_practice_eligibility", {
    p_min_attempts: SMART_PRACTICE_MIN_ATTEMPTS,
  });
  if (error) throw new Error(`get_smart_practice_eligibility: ${error.message}`);

  const res = data as EligibilityResponse;
  return {
    eligible: res.eligible,
    attempts: res.attempts,
    minAttempts: res.min_attempts,
  };
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
    p_min_attempts: SMART_PRACTICE_MIN_ATTEMPTS,
  });
  if (error) throw new Error(`get_smart_practice_questions: ${error.message}`);

  const res = data as SmartPracticeResponse;
  return {
    eligible: res.eligible,
    attempts: res.attempts,
    minAttempts: res.min_attempts,
    questions: (res.questions ?? []).map(toMCQ),
    topicsIncluded: res.topics_included,
  };
}
