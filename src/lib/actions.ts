'use server';

import { tailorExplanation } from '@/ai/flows/tailor-explanations-to-student-profile';
import type { TailorExplanationInput, TailorExplanationOutput } from '@/ai/flows/tailor-explanations-to-student-profile';
import { generateInteractiveQuizzes } from '@/ai/flows/generate-interactive-quizzes';
import type { GenerateInteractiveQuizzesInput, GenerateInteractiveQuizzesOutput } from '@/ai/flows/generate-interactive-quizzes';

const MAX_RETRIES = 5;
const INITIAL_DELAY_MS = 1000;

async function callWithRetry<T extends (...args: any[]) => any>(
  fn: T,
  ...args: Parameters<T>
): Promise<ReturnType<T> | { error: string }> {
  let delayMs = INITIAL_DELAY_MS;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const result = await fn(...args);
      return result;
    } catch (e: any) {
      const errorMessage = e.message || '';
      if (
        i < MAX_RETRIES - 1 &&
        (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('unavailable'))
      ) {
        console.warn(`Attempt ${i + 1} failed with 503 error. Retrying in ${delayMs}ms...`);
        await new Promise((r) => setTimeout(r, delayMs));
        delayMs *= 2; // Exponential backoff
      } else {
        console.error(`Error generating response after ${i + 1} attempts:`, e);
        return { error: `An error occurred while generating the response. The AI model may be temporarily unavailable. Please try again later. (Details: ${errorMessage})` };
      }
    }
  }
  return { error: 'The AI model is currently overloaded. Please try again in a few minutes.' };
}


export async function getExplanation(input: TailorExplanationInput): Promise<TailorExplanationOutput | { error: string }> {
  return callWithRetry(tailorExplanation, input);
}

export async function getQuiz(input: GenerateInteractiveQuizzesInput): Promise<GenerateInteractiveQuizzesOutput | { error: string }> {
  return callWithRetry(generateInteractiveQuizzes, input);
}
