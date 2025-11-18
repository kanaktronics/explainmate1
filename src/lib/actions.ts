'use server';

import { tailorExplanation } from '@/ai/flows/tailor-explanations-to-student-profile';
import type { TailorExplanationInput, TailorExplanationOutput } from '@/ai/flows/tailor-explanations-to-student-profile';
import { generateInteractiveQuizzes } from '@/ai/flows/generate-interactive-quizzes';
import type { GenerateInteractiveQuizzesInput, GenerateInteractiveQuizzesOutput } from '@/ai/flows/generate-interactive-quizzes';
import { googleAI } from '@genkit-ai/google-genai';


export async function getExplanation(input: TailorExplanationInput): Promise<TailorExplanationOutput | { error: string }> {
  const primaryModel = googleAI.model('gemini-2.5-flash');
  const fallbackModel = googleAI.model('gemini-pro');

  try {
    // Attempt with the primary model first
    return await tailorExplanation(input, primaryModel);
  } catch (e: any) {
    const errorMessage = e.message || '';
    const isOverloaded = errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('unavailable');
    
    // If it's an overload error, try the fallback model
    if (isOverloaded) {
      console.warn(`Primary model failed. Attempting fallback with ${fallbackModel.name}.`);
      try {
        return await tailorExplanation(input, fallbackModel);
      } catch (fallbackError: any) {
         console.error(`Fallback attempt also failed:`, fallbackError);
         return { error: 'The AI service is currently experiencing very high demand. Please try again in a few minutes.' };
      }
    }
    
    // For non-overload errors, fail immediately
    console.error(`An unexpected error occurred:`, e);
    return { error: 'An unexpected error occurred while generating the response. Please try again.' };
  }
}

export async function getQuiz(input: GenerateInteractiveQuizzesInput): Promise<GenerateInteractiveQuizzesOutput | { error: string }> {
    try {
        return await generateInteractiveQuizzes(input);
    } catch(e: any) {
        console.error("Error generating quiz:", e);
        const errorMessage = e.message || '';
        if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('unavailable')) {
            return { error: 'The AI service is currently experiencing very high demand. Please try again in a few minutes.' };
        }
        return { error: 'An unexpected error occurred while generating the quiz. Please try again.' };
    }
}
