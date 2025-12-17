
import { ProgressEngineOutput } from "@/ai/flows/run-progress-engine";
import { GenerateExamPlanOutput } from "@/ai/flows/generate-exam-plan";
import { GenerateSubjectTopicsOutput } from "@/ai/flows/generate-subject-topics";

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
  proDailyRequests: number;
  proRequestTimestamps: string[];
  isBlocked: boolean;
  weeklyTimeSpent: number;
  timeSpentLastReset: string;
  dyslexiaFriendlyMode?: boolean;
}

export interface Explanation {
  explanation: string;
  roughWork: string;
  realWorldExamples: string;
  fairWork: string;
  mindMap: string;
}

export interface TeacherCompanionResponse {
  response: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | Explanation | TeacherCompanionResponse | { text: string; imageUrl?: string };
}

export type ExamPlan = GenerateExamPlanOutput;

export interface HistoryItem {
  id: string;
  topic: string;
  messages?: ChatMessage[];
  examPlan?: ExamPlan;
  timestamp: string;
  type: 'explanation' | 'teacher-companion' | 'exam-prep';
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

export interface Interaction {
  id: string;
  timestamp: string;
  type: 'explanation' | 'quiz_start' | 'quiz_answer' | 'teacher_companion_chat';
  topic: string;
  payload?: any;
}

export type ProgressData = Omit<ProgressEngineOutput, 'totalMinutesAllTime' | 'minutesLast7Days' | 'progressGrowth' | 'overallProgressPercent'>;

export type SubjectTopics = GenerateSubjectTopicsOutput;

export type AppView = 'welcome' | 'explanation' | 'quiz' | 'auth' | 'forgot-password' | 'teacher-companion' | 'progress' | 'exam-prep';

    