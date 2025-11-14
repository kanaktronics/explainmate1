'use server';
/**
 * @fileOverview Generates rough work derivations for a given problem.
 *
 * - generateRoughWork - A function that handles the generation of rough work derivations.
 * - GenerateRoughWorkInput - The input type for the generateRoughWork function.
 * - GenerateRoughWorkOutput - The return type for the generateRoughWork function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRoughWorkInputSchema = z.object({
  problem: z.string().describe('The problem for which to generate rough work derivations.'),
  studentProfile: z.string().describe('The profile of the student, including their class, board, and weak subjects.'),
});
export type GenerateRoughWorkInput = z.infer<typeof GenerateRoughWorkInputSchema>;

const GenerateRoughWorkOutputSchema = z.object({
  derivations: z.string().describe('The step-by-step rough work derivations for the given problem.'),
});
export type GenerateRoughWorkOutput = z.infer<typeof GenerateRoughWorkOutputSchema>;

export async function generateRoughWork(input: GenerateRoughWorkInput): Promise<GenerateRoughWorkOutput> {
  return generateRoughWorkFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRoughWorkPrompt',
  input: {schema: GenerateRoughWorkInputSchema},
  output: {schema: GenerateRoughWorkOutputSchema},
  prompt: `You are an expert tutor specializing in explaining solutions to problems with clear step-by-step rough work derivations.

  The student has the following profile:
  {{studentProfile}}

  Generate the rough work derivations for the following problem:
  {{problem}}`,
});

const generateRoughWorkFlow = ai.defineFlow(
  {
    name: 'generateRoughWorkFlow',
    inputSchema: GenerateRoughWorkInputSchema,
    outputSchema: GenerateRoughWorkOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
