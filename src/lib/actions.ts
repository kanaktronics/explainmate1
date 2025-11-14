'use server';

import { tailorExplanation } from '@/ai/flows/tailor-explanations-to-student-profile';
import type { TailorExplanationInput, TailorExplanationOutput } from '@/ai/flows/tailor-explanations-to-student-profile';
import { generateInteractiveQuizzes } from '@/ai/flows/generate-interactive-quizzes';
import type { GenerateInteractiveQuizzesInput, GenerateInteractiveQuizzesOutput } from '@/ai/flows/generate-interactive-quizzes';

export async function getExplanation(input: TailorExplanationInput): Promise<TailorExplanationOutput | { error: string }> {
  try {
    const result = await tailorExplanation(input);
    return result;
  } catch (error) {
    console.error('Error generating explanation:', error);
    return { error: 'An error occurred while generating the explanation. Please try again.' };
  }
}

export async function getQuiz(input: GenerateInteractiveQuizzesInput): Promise<GenerateInteractiveQuizzesOutput | { error: string }> {
  try {
    const result = await generateInteractiveQuizzes(input);
    return result;
  } catch (error) {
    console.error('Error generating quiz:', error);
    return { error: 'An error occurred while generating the quiz. Please try again.' };
  }
}
