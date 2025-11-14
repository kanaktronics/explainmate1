'use server';

/**
 * @fileOverview Generates real-world examples related to a given topic for better understanding.
 *
 * - generateRealWorldExamples - A function that generates real-world examples for a given topic.
 * - GenerateRealWorldExamplesInput - The input type for the generateRealWorldExamples function.
 * - GenerateRealWorldExamplesOutput - The return type for the generateRealWorldExamples function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRealWorldExamplesInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate real-world examples.'),
  studentProfile: z.string().optional().describe('The student profile data (class, board, weak subjects) to adjust complexity and language.'),
});

export type GenerateRealWorldExamplesInput = z.infer<typeof GenerateRealWorldExamplesInputSchema>;

const GenerateRealWorldExamplesOutputSchema = z.object({
  examples: z.array(z.string()).describe('An array of real-world examples related to the topic.'),
});

export type GenerateRealWorldExamplesOutput = z.infer<typeof GenerateRealWorldExamplesOutputSchema>;

export async function generateRealWorldExamples(input: GenerateRealWorldExamplesInput): Promise<GenerateRealWorldExamplesOutput> {
  return generateRealWorldExamplesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRealWorldExamplesPrompt',
  input: {schema: GenerateRealWorldExamplesInputSchema},
  output: {schema: GenerateRealWorldExamplesOutputSchema},
  prompt: `You are an expert tutor specializing in creating clear, engaging real-world examples for middle and high school students.

  Generate a list of real-world examples related to the following topic:
  {{topic}}

  The examples should be tailored to the student's profile, if provided.  Consider the student's class, board, and weak subjects when crafting the examples, and adjust the complexity and language appropriately.
  Here is the student profile:
  {{#if studentProfile}}
  {{studentProfile}}
  {{else}}
  No student profile provided.
  {{/if}}
  Format the examples as a numbered list.
  `,
});

const generateRealWorldExamplesFlow = ai.defineFlow(
  {
    name: 'generateRealWorldExamplesFlow',
    inputSchema: GenerateRealWorldExamplesInputSchema,
    outputSchema: GenerateRealWorldExamplesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
