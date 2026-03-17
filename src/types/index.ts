export type ModelProvider = 'gemini' | 'groq' | 'mistral' | 'deepseek' | 'nemotron' | 'compare';

export interface ModelResponse {
  modelName: string;
  content: string;
}

export interface JudgeEvaluation {
  modelName: string;
  scores: {
    accuracy: number;     // out of 10
    clarity: number;      // out of 10
    completeness: number; // out of 10
  };
  totalScore: number;     // out of 30
  reason: string;
}

export interface CompareResponse {
  answers: ModelResponse[];
  evaluation: JudgeEvaluation[];
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  comparisons?: ModelResponse[];
  evaluations?: JudgeEvaluation[];
  fileName?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
}