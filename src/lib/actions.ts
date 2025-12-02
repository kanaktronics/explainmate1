'use server';

import { tailorExplanation } from '@/ai/flows/tailor-explanations-to-student-profile';
import type { TailorExplanationInput, TailorExplanationOutput } from '@/ai/flows/tailor-explanations-to-student-profile';
import { generateInteractiveQuizzes } from '@/ai/flows/generate-interactive-quizzes';
import type { GenerateInteractiveQuizzesInput, GenerateInteractiveQuizzesOutput } from '@/ai/flows/generate-interactive-quizzes';
import { ChatMessage } from './types';

// Helper function to convert Explanation objects to strings for the AI prompt
function prepareChatHistoryForAI(chatHistory: ChatMessage[]): any[] {
  return chatHistory.map(message => {
    if (message.role === 'assistant' && typeof message.content === 'object') {
      return {
        role: message.role,
        content: JSON.stringify(message.content),
      };
    }
    return message;
  });
}


export async function getExplanation(input: TailorExplanationInput): Promise<TailorExplanationOutput | { error: string }> {
  try {
    const preparedInput = {
      ...input,
      chatHistory: prepareChatHistoryForAI(input.chatHistory),
    };
    const result = await tailorExplanation(preparedInput);
    
    if (!result) {
      throw new Error('AI did not return a response.');
    }
    
    // Check if the AI decided it couldn't answer.
    if (result.explanation === 'N/A' && result.roughWork === 'N/A') {
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
      return { error: 'You have made too many requests in a short period. Please wait a moment before trying again.' };
    }

    return { error: 'An unexpected error occurred while generating the response. Please try again.' };
  }
}

export async function getQuiz(input: GenerateInteractiveQuizzesInput): Promise<GenerateInteractiveQuizzesOutput | { error: string }> {
    try {
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
