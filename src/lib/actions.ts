'use server';

import { tailorExplanation } from '@/ai/flows/tailor-explanations-to-student-profile';
import type { TailorExplanationInput, TailorExplanationOutput } from '@/ai/flows/tailor-explanations-to-student-profile';
import { generateInteractiveQuizzes } from '@/ai/flows/generate-interactive-quizzes';
import type { GenerateInteractiveQuizzesInput, GenerateInteractiveQuizzesOutput } from '@/ai/flows/generate-interactive-quizzes';
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';

const MAX_RETRIES = 5; // Will try primary model 5 times
const INITIAL_DELAY_MS = 200;

async function callWithRetry<F extends (...args: any[]) => any>(
  fn: F,
  input: Parameters<F>[0],
  primaryModel: string,
  fallbackModel: string
): Promise<ReturnType<F> | { error: string }> {
  let delayMs = INITIAL_DELAY_MS;

  // Try the primary model with retries
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const result = await ai.run(fn.name, () => fn(input), { model: googleAI.model(primaryModel) });
      return result;
    } catch (e: any) {
      const errorMessage = e.message || '';
      const isOverloaded = errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('unavailable');

      if (isOverloaded) {
        if (i < MAX_RETRIES - 1) {
          console.warn(`Attempt ${i + 1} with ${primaryModel} failed. Retrying in ${delayMs}ms...`);
          await new Promise((r) => setTimeout(r, delayMs));
          delayMs *= 2; // Exponential backoff
        }
      } else {
        // For non-overload errors, fail immediately
        console.error(`Non-overload error with ${primaryModel}:`, e);
        return { error: 'An unexpected error occurred while generating the response. Please try again.' };
      }
    }
  }

  // If all retries fail, try the fallback model once
  console.warn(`All retries for ${primaryModel} failed. Attempting fallback with ${fallbackModel}.`);
  try {
    const result = await ai.run(fn.name, () => fn(input), { model: googleAI.model(fallbackModel) });
    return result;
  } catch (e: any) {
    console.error(`Fallback attempt with ${fallbackModel} also failed:`, e);
    const errorMessage = e.message || '';
    if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('unavailable')) {
        return { error: 'The AI service is currently experiencing very high demand. Please try again in a few minutes.' };
    }
    return { error: 'An unexpected error occurred while generating the response. Please try again.' };
  }
}

export async function getExplanation(input: TailorExplanationInput): Promise<TailorExplanationOutput | { error: string }> {
  return callWithRetry(tailorExplanation, input, 'gemini-2.5-flash', 'gemini-pro');
}

export async function getQuiz(input: GenerateInteractiveQuizzesInput): Promise<GenerateInteractiveQuizzesOutput | { error: string }> {
  // Quizzes can also use the fallback logic
  return callWithRetry(generateInteractiveQuizzes, input, 'gemini-2.5-flash', 'gemini-pro');
}
