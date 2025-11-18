'use server';

import { tailorExplanation } from '@/ai/flows/tailor-explanations-to-student-profile';
import type { TailorExplanationInput, TailorExplanationOutput } from '@/ai/flows/tailor-explanations-to-student-profile';
import { generateInteractiveQuizzes } from '@/ai/flows/generate-interactive-quizzes';
import type { GenerateInteractiveQuizzesInput, GenerateInteractiveQuizzesOutput } from '@/ai/flows/generate-interactive-quizzes';
import { googleAI } from '@genkit-ai/google-genai';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getExplanation(input: TailorExplanationInput): Promise<TailorExplanationOutput | { error: string }> {
  const model = googleAI.model('gemini-2.5-flash');
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await tailorExplanation(input, model);
    } catch (e: any) {
      lastError = e;
      const errorMessage = e.message || '';
      const isOverloaded = errorMessage.includes('503') || errorMessage.includes('overloaded');

      if (isOverloaded) {
        if (attempt < maxRetries) {
          await sleep(1000 * attempt); // Simple linear backoff
          continue;
        } else {
          console.error(`All ${maxRetries} retry attempts failed.`, lastError);
          return { error: 'The AI model is currently experiencing very high demand. Please try again in a few minutes.' };
        }
      }
      
      console.error(`An unexpected error occurred:`, e);
      break; 
    }
  }
  
  return { error: 'An unexpected error occurred while generating the response. Please try again.' };
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
