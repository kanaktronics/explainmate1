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
  const primaryModel = googleAI.model('gemini-2.5-flash');
  const fallbackModel = googleAI.model('gemini-2.0-flash');
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await tailorExplanation(input, primaryModel);
    } catch (e: any) {
      const errorMessage = e.message || '';
      const isOverloaded = errorMessage.includes('503') || errorMessage.includes('overloaded');
      
      if (isOverloaded) {
        if (attempt < maxRetries) {
          await sleep(500 * attempt); // Brief backoff before retry
          continue;
        }
        // If all retries on primary model fail, break the loop to try the fallback.
        break;
      }
      
      console.error(`An unexpected error occurred with primary model:`, e);
      return { error: 'An unexpected error occurred while generating the response. Please try again.' };
    }
  }

  // If the loop finished due to retries being exhausted, try the fallback model.
  try {
    return await tailorExplanation(input, fallbackModel);
  } catch (e: any) {
    console.error(`Fallback model also failed:`, e);
    const errorMessage = e.message || '';
    if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      return { error: 'The AI service is currently experiencing very high demand. Please try again in a few minutes.' };
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
