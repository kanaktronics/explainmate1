'use server';

/**
 * @fileOverview Tailors explanations to the student's profile, including class, board, and weak subjects.
 *
 * - tailorExplanation - A function that tailors explanations based on the student's profile.
 * - TailorExplanationInput - The input type for the tailorExplanation function.
 * - TailorExplanationOutput - The return type for the tailorExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TailorExplanationInputSchema = z.object({
  topic: z.string().describe('The specific question or concept the student needs help with.'),
  studentProfile: z
    .object({
      classLevel: z.string().describe('The class level of the student (e.g., 10th grade).'),
      board: z.string().describe('The educational board the student follows (e.g., CBSE, ICSE, State Board).'),
      weakSubjects: z.string().describe('Comma-separated list of subjects the student finds challenging.'),
    })
    .describe('The profile of the student, including their class level, board, and weak subjects.'),
});
export type TailorExplanationInput = z.infer<typeof TailorExplanationInputSchema>;

const TailorExplanationOutputSchema = z.object({
  explanation: z.string().describe('The tailored explanation for the given topic, student profile and question.'),
  roughWork: z.string().describe('Rough work derivations related to the explanation.'),
  realWorldExamples: z.string().describe('Real-world examples to illustrate the explanation.'),
  fairWork: z.string().describe('Fair work, alternative explanation.'),
});
export type TailorExplanationOutput = z.infer<typeof TailorExplanationOutputSchema>;

export async function tailorExplanation(input: TailorExplanationInput): Promise<TailorExplanationOutput> {
  return tailorExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tailorExplanationPrompt',
  input: {schema: TailorExplanationInputSchema},
  output: {schema: TailorExplanationOutputSchema},
  prompt: `You are an expert AI tutor, skilled at explaining complex topics to students of varying backgrounds.

  Based on the student's profile, provide a tailored explanation for the given question. The explanation should be clear, concise, and appropriate for the student's class level and board.
  From the user's question, you must first identify the underlying topic.

  Student Profile:
  - Class Level: {{{studentProfile.classLevel}}}
  - Board: {{{studentProfile.board}}}
  - Weak Subjects: {{{studentProfile.weakSubjects}}}

  Question: {{{topic}}}

  Explanation: 
  Rough Work Derivations:
  Real-World Examples:
  Fair Work Explanation:

  Make sure that all of your output sections are well formatted and complete. Even if you are unable to create a section, it should still be present, and marked as N/A.

  If the question is not an educational question, respond that you cannot answer the request.
`,
});

const tailorExplanationFlow = ai.defineFlow(
  {
    name: 'tailorExplanationFlow',
    inputSchema: TailorExplanationInputSchema,
    outputSchema: TailorExplanationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
