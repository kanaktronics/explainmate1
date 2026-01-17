'use server';
/**
 * @fileOverview Generates simple revision cards from a given text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/* ------------------ SCHEMAS ------------------ */

const FlashcardSchema = z.object({
  content: z.string().min(10).describe('A concise summary or key point about the text, formatted in Markdown.'),
});

const GenerateFlashcardsInputSchema = z.object({
  text: z.string().min(20),
});

export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema).length(5),
});

export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

/* ------------------ MAIN FUNCTION ------------------ */

export async function generateFlashcards(
  input: GenerateFlashcardsInput
): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

/* ------------------ PROMPT ------------------ */

const flashcardPrompt = ai.definePrompt({
  name: 'flashcardPrompt',
  input: { schema: GenerateFlashcardsInputSchema },
  output: { schema: GenerateFlashcardsOutputSchema },
  prompt: `
You are a revision card generator for students.

Your task:
Analyze the provided text and extract EXACTLY 5 key points or concise summaries.
Each point should be a self-contained piece of information, ideal for quick revision.

STRICT RULES:
1. Output ONLY a valid JSON object.
2. The JSON object must contain a "flashcards" array.
3. The "flashcards" array must contain EXACTLY 5 items.
4. Each item in the array must be an object with a single "content" key.
5. The "content" should be a string containing the key point, formatted in simple Markdown.
6. Do not include any extra text, comments, or markdown formatting outside of the JSON.

Text to analyze:
{{{text}}}

Generate the JSON output now.
`,
});

/* ------------------ FLOW ------------------ */

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async (input) => {
    const { output } = await flashcardPrompt(input);

    if (!output?.flashcards || output.flashcards.length === 0) {
      throw new Error("The AI failed to generate any revision cards.");
    }

    return output;
  }
);
