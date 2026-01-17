
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

/* ------------------ PROMPT (HARDENED) ------------------ */

const flashcardPrompt = ai.definePrompt({
  name: 'flashcardPrompt',
  input: { schema: GenerateFlashcardsInputSchema },
  output: { schema: GenerateFlashcardsOutputSchema },
  prompt: `
You are a flashcard generator for Indian students.

Your task:
Convert the given text into EXACTLY {{count}} flashcards.

Each flashcard MUST follow this format:

{
  "front": "Short question or key term",
  "back": "Very short answer (1–2 lines)"
}

STRICT RULES:
1. Output ONLY JSON
2. No extra text, no markdown
3. Keep answers short and simple
4. Do NOT skip any flashcard
5. Avoid long paragraphs
6. Avoid complex language

Text:
{{{text}}}

Output JSON now.
`,
});

/* ------------------ FLOW (RETRY + VALIDATION) ------------------ */

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async (input) => {
    let attempt = 0;
    let output: GenerateFlashcardsOutput | undefined;

    while (attempt < 2) {
      const result = await flashcardPrompt(input);
      output = result.output;

      if (output?.flashcards?.length === input.count) {
        return output;
      }

      attempt++;
    }

    throw new Error("Flashcard generation failed after retries.");
  }
);
