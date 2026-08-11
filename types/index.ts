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
}

export interface Module {
  id: string;
  blockId: string;
  name: string;
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
