'use server';
/**
 * @fileOverview Generates revision flashcards from a given text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/* ------------------ SCHEMAS ------------------ */

const FlashcardSchema = z.object({
  front: z.string().min(3),
  back: z.string().min(3),
});

const GenerateFlashcardsInputSchema = z.object({
  text: z.string().min(20),
  count: z.number().min(3).max(10).default(5),
});

export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema),
});

export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

/* ------------------ MAIN FUNCTION ------------------ */

export async function generateFlashcards(
  input: GenerateFlashcardsInput
): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

/* ------------------ FLOW (WITH ACTUAL AI CALL) ------------------ */

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async (input) => {
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        // Actually call the AI model with proper prompt
        const result = await ai.generate({
          model: 'googleai/gemini-2.0-flash-exp', // Gemini 2.0 Flash
          prompt: `You are a flashcard generator for Indian students.

Your task:
Convert the given text into EXACTLY ${input.count} flashcards.

Each flashcard MUST follow this format:

{
  "flashcards": [
    {
      "front": "Short question or key term",
      "back": "Very short answer (1–2 lines)"
    }
  ]
}

STRICT RULES:
1. Output ONLY valid JSON
2. No extra text, no markdown, no code blocks
3. Keep answers short and simple
4. Create EXACTLY ${input.count} flashcards
5. Avoid long paragraphs
6. Use simple language

Text to convert:
${input.text}

Output the JSON now:`,
          output: {
            schema: GenerateFlashcardsOutputSchema,
          },
        });

        const output = result.output as GenerateFlashcardsOutput;

        // Validate we got the right number of flashcards
        if (output?.flashcards?.length === input.count) {
          return output;
        }

        console.warn(`Attempt ${attempt + 1}: Got ${output?.flashcards?.length} flashcards, expected ${input.count}`);
        
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
      }

      attempt++;
    }

    // Fallback: return whatever we got or throw error
    throw new Error(`Failed to generate exactly ${input.count} flashcards after ${maxAttempts} attempts.`);
  }
);