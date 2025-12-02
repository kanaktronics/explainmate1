
'use server';

import { tailorExplanation } from '@/ai/flows/tailor-explanations-to-student-profile';
import type { TailorExplanationInput, TailorExplanationOutput } from '@/ai/flows/tailor-explanations-to-student-profile';
import { generateInteractiveQuizzes } from '@/ai/flows/generate-interactive-quizzes';
import type { GenerateInteractiveQuizzesInput, GenerateInteractiveQuizzesOutput } from '@/ai/flows/generate-interactive-quizzes';
import { ChatMessage, StudentProfile } from './types';

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

export async function getExplanation(input: TailorExplanationInput): Promise<TailorExplanationOutput | { error: string }> {
  try {
    const { studentProfile, chatHistory } = input;

    // Enforce daily limit for free users
    if (!studentProfile.isPro && studentProfile.dailyUsage >= FREE_TIER_EXPLANATION_LIMIT) {
        return { error: "DAILY_LIMIT_REACHED" };
    }

    const result = await tailorExplanation({
      studentProfile,
      chatHistory: convertToGenkitHistory(chatHistory),
    });
    
    if (!result) {
      throw new Error('AI did not return a response.');
    }
    
    // Check if the AI decided it couldn't answer.
    if (result.explanation === 'N/A' && result.roughWork === 'N/A' && result.realWorldExamples === 'N/A' && result.fairWork === 'N/A') {
        return { error: "I can only answer educational questions. Please ask me something related to your studies." };
    }
    
    // Handle the special "who created you" case
    if (result.fairWork.includes("Kanak Raj")) {
        return { error: result.fairWork };
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

export async function getQuiz(input: GenerateInteractiveQuizzesInput & { studentProfile: StudentProfile }): Promise<GenerateInteractiveQuizzesOutput | { error: string }> {
    try {
        const { studentProfile } = input;
        if (!studentProfile.isPro && studentProfile.dailyUsage >= FREE_TIER_QUIZ_LIMIT) {
            return { error: "DAILY_LIMIT_REACHED" };
        }
        
        const result = await generateInteractiveQuizzes(input);
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
