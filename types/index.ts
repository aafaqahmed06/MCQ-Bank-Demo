export interface UserProfile {
  college: string;
  year: number;
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
