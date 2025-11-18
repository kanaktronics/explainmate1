export interface StudentProfile {
  name: string;
  classLevel: string;
  board: string;
  weakSubjects: string;
}

export interface Explanation {
  explanation: string;
  roughWork: string;
  realWorldExamples: string;
  fairWork: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | Explanation;
}

export interface HistoryItem {
  id: string;
  topic: string;
  messages: ChatMessage[];
  timestamp: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  quiz: QuizQuestion[];
}

export type AppView = 'welcome' | 'explanation' | 'quiz' | 'about' | 'contact';
