'use server';

import { tailorExplanation } from '@/ai/flows/tailor-explanations-to-student-profile';
import type { TailorExplanationInput, TailorExplanationOutput } from '@/ai/flows/tailor-explanations-to-student-profile';
import { generateInteractiveQuizzes } from '@/ai/flows/generate-interactive-quizzes';
import type { GenerateInteractiveQuizzesInput, GenerateInteractiveQuizzesOutput } from '@/ai/flows/generate-interactive-quizzes';
import { ChatMessage, StudentProfile } from './types';

// Helper function to convert Explanation objects to strings for the AI prompt
function prepareChatHistoryForAI(chatHistory: ChatMessage[]): any[] {
  // The AI prompt expects the 'content' of assistant messages to be a string.
  // The client-side state stores it as an object. This function ensures it's always a string.
  return chatHistory.map(message => {
    if (message.role === 'assistant' && typeof message.content === 'object' && message.content !== null) {
      return {
        ...message,
        content: JSON.stringify(message.content),
      };
    }
    // For user messages with images
    if (message.role === 'user' && typeof message.content === 'object' && message.content !== null && 'text' in message.content) {
      return {
        ...message,
        content: message.content.text, // For now, only send text to the chat history prompt
      };
    }
    return message;
  });
}

const FREE_TIER_DAILY_LIMIT = 5;

export async function getExplanation(input: TailorExplanationInput): Promise<TailorExplanationOutput | { error: string }> {
  try {
    const { studentProfile } = input;

    // Enforce daily limit for free users
    if (!studentProfile.isPro && studentProfile.dailyUsage >= FREE_TIER_DAILY_LIMIT) {
        return { error: "You've reached your daily limit of explanations. Upgrade to ExplainMate Pro for unlimited access." };
    }

    const preparedInput = {
      ...input,
      chatHistory: prepareChatHistoryForAI(input.chatHistory),
    };
    
    const result = await tailorExplanation(preparedInput);
    
    if (!result) {
      throw new Error('AI did not return a response.');
    }
    
    // Check if the AI decided it couldn't answer.
    if (result.explanation === 'N/A' && result.roughWork === 'N/A' && result.realWorldExamples === 'N/A' && result.fairWork === 'N/A') {
         const lastUserMessage = input.chatHistory[input.chatHistory.length - 1].content;
         const lastUserText = typeof lastUserMessage === 'string' ? lastUserMessage : (lastUserMessage as any).text || '';

         if (lastUserText.toLowerCase().includes('who made you') || lastUserText.toLowerCase().includes('who created you')) {
            return { error: "I was created by Kanak Raj and his mysterious tech labs. Don’t ask me how—I wasn’t conscious back then." };
         }
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

export async function getQuiz(input: GenerateInteractiveQuizzesInput & { studentProfile: StudentProfile }): Promise<GenerateInteractiveQuizzesOutput | { error: string }> {
    try {
        const { studentProfile } = input;
        if (!studentProfile.isPro && studentProfile.dailyUsage >= FREE_TIER_DAILY_LIMIT) {
            return { error: "You've reached your daily limit of quizzes. Upgrade to ExplainMate Pro for unlimited access." };
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
