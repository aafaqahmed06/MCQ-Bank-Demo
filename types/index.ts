export interface UserProfile {
  college: string;
  year: number;
}

export interface DBProfile {
  id: string;
  full_name: string | null;
  college_id: string | null;
  program_id: string | null;
  academic_year_id: string | null;
  role: "student" | "reviewer" | "admin" | "super_admin";
  avatar_url: string | null;
}

export interface Block {
  id: string;
  name: string;
  year: number;
  subjectCount?: number;
  topicsCompleted?: number;
  topicsTotal?: number;
}

export interface Module {
  id: string;
  blockId: string;
  name: string;
  topicsCompleted?: number;
  topicsTotal?: number;
}

/** Per-topic-group completion state (derived from user_topic_progress). */
export interface TopicGroupStatus {
  completedTopics: number;
  totalTopics: number;
  completed: boolean;
}

export interface TopicGroup {
  id: string;
  moduleId: string;
  name: string;
  /** The exact topic strings that belong to this group */
  topics: string[];
}

/** Structure only — no MCQ data populated yet */
export interface MCQ {
  id: string;
  blockId: string;
  moduleId: string;
  topic: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number;
}

// ── Exam engine (Supabase RPC payloads) ────────────────────────────────
// Do NOT add `correct_answer`/`explanation` to these payloads: they must
// never reach the client during an active exam.

/** A single in-progress exam question (key-free by design). */
export interface ExamQuestionPayload {
  mcq_id: string;
  question: string;
  options: string[];
  topic: string | null;
  question_order: number;
}

export interface StartExamResponse {
  exam_id: string;
  questions: ExamQuestionPayload[];
}

export interface ExamAnswerSubmission {
  mcq_id: string;
  selected_answer: number | null;
}

export interface SubmitExamResponse {
  exam_id: string;
  total_questions: number;
  correct_count: number;
  score: number;
  accuracy: number;
}

/** Review item returned only AFTER an exam is submitted. */
export interface ExamReviewItem {
  mcq_id: string;
  question: string;
  options: string[];
  selected_answer: number | null;
  correct_answer: number;
  is_correct: boolean;
  explanation: string;
  question_order: number;
}
