
'use server';

import { tailorExplanation } from '@/ai/flows/tailor-explanations-to-student-profile';
import type { TailorExplanationInput, TailorExplanationOutput } from '@/ai/flows/tailor-explanations-to-student-profile';
import { generateInteractiveQuizzes } from '@/ai/flows/generate-interactive-quizzes';
import type { GenerateInteractiveQuizzesInput, GenerateInteractiveQuizzesOutput } from '@/ai/flows/generate-interactive-quizzes';
import { teacherCompanion } from '@/ai/flows/teacher-companion-flow';
import type { TeacherCompanionInput, TeacherCompanionOutput } from '@/ai/flows/teacher-companion-flow';
import { runProgressEngine } from '@/ai/flows/run-progress-engine';
import type { ProgressEngineInput, ProgressEngineOutput } from '@/ai/flows/run-progress-engine';
import { generateExamPlan } from '@/ai/flows/generate-exam-plan';
import type { GenerateExamPlanInput, GenerateExamPlanOutput } from '@/ai/flows/generate-exam-plan';
import { getTopicsForSubject } from '@/ai/flows/generate-subject-topics';
import type { GenerateSubjectTopicsInput, GenerateSubjectTopicsOutput } from '@/ai/flows/generate-subject-topics';

import { ChatMessage, StudentProfile, SubjectTopics } from './types';

function convertToGenkitHistory(chatHistory: ChatMessage[]) {
  return chatHistory.map(message => {
    // Handle Teacher Companion mode response
    if (message.role === 'assistant' && typeof message.content === 'object' && 'response' in message.content) {
      return {
        role: 'assistant',
        content: [{ text: message.content.response }]
      };
    }
    // Handle Explanation mode response
    if (message.role === 'assistant') {
      return {
        role: 'assistant',
        content: [{ text: JSON.stringify(message.content) }]
      };
    }

    if (message.role === 'user' && typeof message.content === 'object' && message.content !== null) {
      const contentParts = [];
      if ('text' in message.content) {
        contentParts.push({ text: message.content.text });
      }
      if ('imageUrl' in message.content && message.content.imageUrl) {
        contentParts.push({ media: { url: message.content.imageUrl } });
      }
      return {
        role: 'user',
        content: contentParts,
      };
    }
    
    // Fallback for simple string content from user
    return {
      role: message.role,
      content: [{ text: message.content as string }]
    };
  });
}


const FREE_TIER_EXPLANATION_LIMIT = 5;
const FREE_TIER_QUIZ_LIMIT = 1;

// Pro Tier Fair Usage Limits
const PRO_REQUESTS_PER_MINUTE = 15;
const PRO_REQUESTS_DAILY_CEILING = 750; // Increased daily ceiling
const PRO_TIMESTAMP_HISTORY_LIMIT = 100;

async function checkProFairUsage(studentProfile: StudentProfile): Promise<{ allowed: boolean; error?: string }> {
  if (studentProfile.isBlocked) {
    return { allowed: false, error: "ACCOUNT_BLOCKED" };
  }

  // Check daily ceiling
  if ((studentProfile.proDailyRequests || 0) >= PRO_REQUESTS_DAILY_CEILING) {
    return { allowed: false, error: "PRO_DAILY_LIMIT" };
  }
  
  // Check request rate (burst protection)
  const timestamps = studentProfile.proRequestTimestamps || [];
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  
  const recentTimestamps = timestamps.filter(ts => new Date(ts).getTime() > oneMinuteAgo);

  if (recentTimestamps.length >= PRO_REQUESTS_PER_MINUTE) {
      return { allowed: false, error: "PRO_RATE_LIMIT" };
  }

  return { allowed: true };
}

function detectLanguageLabel(text: string): "english" | "hindi" | "hinglish" {
  // 1. Check for Devanagari script for pure Hindi
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  if (hasDevanagari) return "hindi";

  // 2. Check for Hinglish
  // This list avoids short, ambiguous words like "is", "so".
  const hindiWords = [
    "kya", "kaise", "mein", "aur", "ek", "do", "teen",
    "nahi", "haan", "aap", "tum", "hum", "yeh", "woh", "yahan", "wahan",
    "kab", "kyun", "liye", "bhi", "toh", "se", "ko", "ka", "ki", "ke",
    "hota", "hoti", "hote", "gaya", "gayi", "gaye", "tha", "thi", "the",
    "matlab", "kaun"
  ];
  
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  
  // A query is likely Hinglish if it contains at least one specific Hindi word.
  // We check word count to avoid flagging single ambiguous words as Hinglish.
  const containsHindiWord = words.some(word => hindiWords.includes(word));
  
  if (words.length > 2 && containsHindiWord) {
    return "hinglish";
  }

  // 3. Default to English
  return "english";
}


export async function getExplanation(input: { studentProfile: StudentProfile; chatHistory: ChatMessage[] }): Promise<TailorExplanationOutput | { error: string }> {
  try {
    const { studentProfile, chatHistory } = input;
    const userId = studentProfile.id;

    if (!userId) {
      return { error: 'User not found.' };
    }

    if (studentProfile.isPro) {
        const usageCheck = await checkProFairUsage(studentProfile);
        if (!usageCheck.allowed) {
            return { error: usageCheck.error || 'PRO_USAGE_LIMIT' };
        }
    } else {
        if ((studentProfile.dailyUsage || 0) >= FREE_TIER_EXPLANATION_LIMIT) {
            return { error: "DAILY_LIMIT_REACHED" };
        }
    }

    const lastUserMessage = chatHistory[chatHistory.length - 1];
    let userQuestion = '';
    if (typeof lastUserMessage.content === 'string') {
        userQuestion = lastUserMessage.content;
    } else if (typeof lastUserMessage.content === 'object' && 'text' in lastUserMessage.content) {
        userQuestion = lastUserMessage.content.text;
    }

    const lang = detectLanguageLabel(userQuestion);

    const langInstruction = {
        english: `For THIS message, reply ONLY in clear English. Do NOT use Hindi or Hinglish, even if previous messages were in another language.`,
        hindi: `For THIS message, reply ONLY in simple, clear Hindi (using Devanagari script). Do NOT use English sentences unless needed for technical terms.`,
        hinglish: `For THIS message, reply ONLY in Hinglish (Hindi written in English letters). Mix English and Hindi words naturally, as a real person would. Do NOT answer in pure English or pure Devanagari Hindi.`,
    }[lang];

    const result = await tailorExplanation({
      studentProfile: {
        classLevel: studentProfile.classLevel,
        board: studentProfile.board,
        weakSubjects: studentProfile.weakSubjects,
      },
      chatHistory: convertToGenkitHistory(chatHistory),
      languageInstruction: langInstruction,
    });
    
    if (!result) {
      throw new Error('AI did not return a response.');
    }
    
    // Check if the AI decided it couldn't answer (for non-educational questions).
    if (result.explanation && result.explanation !== 'N/A' && result.roughWork === 'N/A' && result.realWorldExamples === 'N/A' && result.fairWork === 'N/A') {
        // This is a conversational response.
        return {
            explanation: result.explanation,
            roughWork: 'N/A',
            realWorldExamples: 'N/A',
            fairWork: 'N/A',
            mindMap: 'N/A',
        };
    }
    
    // Handle the special "who created you" case
    if (result.fairWork.includes("Kanak Raj")) {
        return {
            explanation: result.fairWork,
            roughWork: 'N/A',
            realWorldExamples: 'N/A',
            fairWork: 'N/A',
            mindMap: 'N/A',
        };
    }

    return result;
  } catch (e: any) {
    console.error(`An unexpected error occurred:`, e);
    const errorMessage = e.message || '';

    if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      return { error: 'The AI model is currently experiencing high demand and is overloaded. Please try again in a moment.' };
    }
    
    if (errorMessage.includes('429')) {
      return { error: 'The AI model is temporarily rate-limited. Please wait a few moments before sending another request.' };
    }

    return { error: 'An unexpected error occurred while generating the response. Please try again.' };
  }
}

export async function getQuiz(input: {
    topic: string;
    numQuestions: number;
    studentProfile: StudentProfile;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}): Promise<GenerateInteractiveQuizzesOutput | { error: string }> {
    try {
        const { studentProfile, topic, numQuestions, difficulty } = input;
        const userId = studentProfile.id;

        if (!userId) {
          return { error: 'User not found.' };
        }

        if (studentProfile.isPro) {
            const usageCheck = await checkProFairUsage(studentProfile);
            if (!usageCheck.allowed) {
                return { error: usageCheck.error || 'PRO_USAGE_LIMIT' };
            }
        } else {
            if ((studentProfile.dailyQuizUsage || 0) >= FREE_TIER_QUIZ_LIMIT) {
                return { error: "DAILY_LIMIT_REACHED" };
            }
        }
        
        const result = await generateInteractiveQuizzes({
            topic,
            numQuestions,
            studentProfile: {
                classLevel: studentProfile.classLevel,
                board: studentProfile.board,
                weakSubjects: studentProfile.weakSubjects,
            },
            difficulty: studentProfile.isPro ? difficulty : undefined,
        });

        if (!result) {
          throw new Error('AI did not return a response.');
        }

        return result;
    } catch(e: any) {
        console.error("Error generating quiz:", e);
        const errorMessage = e.message || '';
        if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('unavailable')) {
            return { error: 'The AI service is currently experiencing very high demand. Please try again in a few minutes.' };
        }
        return { error: 'An unexpected error occurred while generating the quiz. Please try again.' };
    }
}

export async function getTeacherCompanionResponse(input: { studentProfile: StudentProfile; chatHistory: ChatMessage[] }): Promise<TeacherCompanionOutput | { error: string }> {
  try {
    const { studentProfile, chatHistory } = input;
    const userId = studentProfile.id;

    if (!userId) {
      return { error: 'User not found.' };
    }

    if (!studentProfile.isPro) {
        return { error: 'PRO_FEATURE_ONLY' };
    }

    const usageCheck = await checkProFairUsage(studentProfile);
    if (!usageCheck.allowed) {
        return { error: usageCheck.error || 'PRO_USAGE_LIMIT' };
    }

    const result = await teacherCompanion({
      chatHistory: convertToGenkitHistory(chatHistory),
      studentProfile: {
        classLevel: studentProfile.classLevel,
        board: studentProfile.board,
        weakSubjects: studentProfile.weakSubjects,
      },
    });
    
    if (!result) {
      throw new Error('AI did not return a response.');
    }
    
    return result;

  } catch (e: any) {
    console.error(`An unexpected error in TeacherCompanionMode:`, e);
    const errorMessage = e.message || '';

    if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      return { error: 'The AI model is currently experiencing high demand and is overloaded. Please try again in a moment.' };
    }
    
    if (errorMessage.includes('429')) {
      return { error: 'The AI model is temporarily rate-limited. Please wait a few moments before sending another request.' };
    }

    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function runProgressEngineAction(input: ProgressEngineInput): Promise<ProgressEngineOutput | { error: string }> {
    try {
        const result = await runProgressEngine(input);
        if (!result) {
            throw new Error("The progress engine did not return a response.");
        }
        return result;
    } catch (e: any) {
        console.error("Error running progress engine:", e);
        return { error: "Failed to analyze progress. Please try again later." };
    }
}

export async function generateExamPlanAction(input: GenerateExamPlanInput): Promise<GenerateExamPlanOutput | { error: string }> {
    try {
        const result = await generateExamPlan(input);
        if (!result) {
            throw new Error("The exam plan generator did not return a response.");
        }
        return result;
    } catch (e: any) {
        console.error("Error generating exam plan:", e);
        return { error: "Failed to generate the exam plan. Please check the inputs and try again." };
    }
}

export async function getSubjectTopics(input: GenerateSubjectTopicsInput): Promise<GenerateSubjectTopicsOutput | { error: string }> {
    try {
        const result = await getTopicsForSubject(input);
        if (!result) {
            throw new Error("The AI did not return any topics.");
        }
        return result;
    } catch (e: any) {
        console.error("Error getting subject topics:", e);
        return { error: "Failed to fetch topics for the selected subject. Please try again." };
    }
}

export { generateExamPlan };
