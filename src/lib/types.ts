

export interface StudentProfile {
  id?: string;
  name: string;
  email: string;
  classLevel: string;
  board: string;
  weakSubjects: string;
  isPro: boolean;
  dailyUsage: number;
  dailyQuizUsage: number;
  lastUsageDate: string;
  proExpiresAt?: string;
  // Pro fair usage
  proDailyRequests?: number;
  proRequestTimestamps?: string[];
  isBlocked?: boolean;
}

export interface Explanation {
  explanation: string;
  roughWork: string;
  realWorldExamples: string;
  fairWork: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | Explanation | { text: string; imageUrl?: string };
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

export type AppView = 'welcome' | 'explanation' | 'quiz' | 'auth' | 'forgot-password';
