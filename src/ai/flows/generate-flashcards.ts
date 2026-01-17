'use server';
/**
 * @fileOverview Generates revision flashcards from a given text.
 *
 * - generateFlashcards - A function that handles flashcard generation.
 * - GenerateFlashcardsInput - The input type for the function.
 * - GenerateFlashcardsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const FlashcardSchema = z.object({
  front: z
    .string()
    .describe('The front of the flashcard, a short question or key term.'),
  back: z
    .string()
    .describe(
      'The back of the flashcard, a concise and easy-to-remember answer or definition.'
    ),
});

const GenerateFlashcardsInputSchema = z.object({
  text: z.string().describe('The educational text to generate flashcards from.'),
  count: z
    .number()
    .min(3)
    .max(10)
    .default(5)
    .describe('The number of flashcards to generate.'),
});
export type GenerateFlashcardsInput = z.infer<
  typeof GenerateFlashcardsInputSchema
>;

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z
    .array(FlashcardSchema)
    .describe('An array of generated flashcards.'),
});
export type GenerateFlashcardsOutput = z.infer<
  typeof GenerateFlashcardsOutputSchema
>;

export async function generateFlashcards(
  input: GenerateFlashcardsInput
): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

const flashcardPrompt = ai.definePrompt({
  name: 'flashcardPrompt',
  input: { schema: GenerateFlashcardsInputSchema },
  output: { schema: GenerateFlashcardsOutputSchema },
  prompt: `You are an expert at creating concise flashcards for student revision. Your task is to extract the most critical information from the provided text and format it into question/answer pairs.

  CRITICAL RULES:
  1.  You MUST generate exactly **{{count}}** flashcards.
  2.  The 'front' of the card MUST be a short question or a key term (e.g., "What is photosynthesis?", "Newton's First Law").
  3.  The 'back' of the card MUST be a very concise, easy-to-remember answer or definition. Do NOT write long paragraphs. Keep it to 1-2 key sentences.

  Text to analyze:
  {{{text}}}

  Generate the JSON output now.`,
});

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async (input) => {
    const { output } = await flashcardPrompt(input);
    return output!;
  }
);
