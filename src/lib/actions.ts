'use server';

import { tailorExplanation } from '@/ai/flows/tailor-explanations-to-student-profile';
import type { TailorExplanationInput, TailorExplanationOutput } from '@/ai/flows/tailor-explanations-to-student-profile';
import { generateInteractiveQuizzes } from '@/ai/flows/generate-interactive-quizzes';
import type { GenerateInteractiveQuizzesInput, GenerateInteractiveQuizzesOutput } from '@/ai/flows/generate-interactive-quizzes';

export async function getExplanation(input: TailorExplanationInput): Promise<TailorExplanationOutput | { error: string }> {
  try {
    return await tailorExplanation(input);
  } catch (e: any) {
    console.error(`An unexpected error occurred:`, e);
    const errorMessage = e.message || '';
    if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      return { error: 'The AI model is currently experiencing high demand. Please try again in a moment.' };
    }
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
