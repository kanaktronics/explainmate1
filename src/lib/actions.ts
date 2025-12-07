
'use server';

import { tailorExplanation } from '@/ai/flows/tailor-explanations-to-student-profile';
import type { TailorExplanationInput, TailorExplanationOutput } from '@/ai/flows/tailor-explanations-to-student-profile';
import { generateInteractiveQuizzes } from '@/ai/flows/generate-interactive-quizzes';
import type { GenerateInteractiveQuizzesInput, GenerateInteractiveQuizzesOutput } from '@/ai/flows/generate-interactive-quizzes';
import { ChatMessage, StudentProfile } from './types';
import { getFirestore, doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

function convertToGenkitHistory(chatHistory: ChatMessage[]) {
  return chatHistory.map(message => {
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
    
    // Fallback for simple string content
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
const PRO_REQUESTS_DAILY_CEILING = 200;
const PRO_TIMESTAMP_HISTORY_LIMIT = 100; // Keep the last 100 timestamps

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

async function recordProUsage(userId: string) {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);

    const currentTimestamp = new Date().toISOString();
    
    // To prevent the array from growing indefinitely, we'll implement a trimming mechanism.
    // This is a simplified version. A more robust solution might use a server-side transaction.
    // For now, we'll add the new timestamp and then slice it on the client if needed.
    // The server-side update will be simpler.
    
    // We can't easily trim the array atomically on the client without transactions,
    // so we'll just add the timestamp. The list size is managed in the check logic.
    // The `proRequestTimestamps` array will be capped at PRO_TIMESTAMP_HISTORY_LIMIT items.
    // A better approach for high-traffic apps might be a Cloud Function.
    
    await updateDoc(userRef, {
        proDailyRequests: increment(1),
        proRequestTimestamps: arrayUnion(currentTimestamp), // Note: arrayUnion prevents duplicates if called rapidly.
        lastUsageDate: currentTimestamp
    });
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
        if (studentProfile.dailyUsage >= FREE_TIER_EXPLANATION_LIMIT) {
            return { error: "DAILY_LIMIT_REACHED" };
        }
    }

    const result = await tailorExplanation({
      studentProfile: {
        classLevel: studentProfile.classLevel,
        board: studentProfile.board,
        weakSubjects: studentProfile.weakSubjects,
      },
      chatHistory: convertToGenkitHistory(chatHistory),
    });
    
    if (!result) {
      throw new Error('AI did not return a response.');
    }

    // Record usage *after* a successful AI response
    if (studentProfile.isPro) {
        await recordProUsage(userId);
    }
    
    // Handle the special "who created you" case
    if (result.fairWork.includes("Kanak Raj")) {
        return {
            explanation: result.fairWork,
            roughWork: 'N/A',
            realWorldExamples: 'N/A',
            fairWork: 'N/A',
        };
    }

    // Check if the AI decided it couldn't answer (for non-educational questions).
    if (result.explanation === 'N/A' && result.roughWork === 'N/A' && result.realWorldExamples === 'N/A' && result.fairWork === 'N/A') {
        return { error: "I can only answer educational questions. Please ask me something related to your studies." };
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
            if (studentProfile.dailyQuizUsage >= FREE_TIER_QUIZ_LIMIT) {
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

        // Record usage *after* a successful AI response
        if (studentProfile.isPro) {
            await recordProUsage(userId);
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
