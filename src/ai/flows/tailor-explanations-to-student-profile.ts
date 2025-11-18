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

const StudentProfileSchema = z.object({
  classLevel: z.string().describe('The class level of the student (e.g., 10th grade).'),
  board: z.string().describe('The educational board the student follows (e.g., CBSE, ICSE, State Board).'),
  weakSubjects: z.string().describe('Comma-separated list of subjects the student finds challenging.'),
});

const TailorExplanationInputSchema = z.object({
  topic: z.string().describe('The specific question or concept the student needs help with.'),
  studentProfile: StudentProfileSchema,
});
export type TailorExplanationInput = z.infer<typeof TailorExplanationInputSchema>;

const TailorExplanationOutputSchema = z.object({
  explanation: z.string().describe('The tailored explanation for the given topic, student profile and question.'),
  roughWork: z.string().describe('Rough work derivations related to the explanation.'),
  realWorldExamples: z.string().describe('Real-world examples to illustrate the explanation.'),
  fairWork: z.string().describe('Fair work, alternative explanation in a clean, notebook-ready format.'),
});
export type TailorExplanationOutput = z.infer<typeof TailorExplanationOutputSchema>;

export async function tailorExplanation(input: TailorExplanationInput): Promise<TailorExplanationOutput> {
  return tailorExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tailorExplanationPrompt',
  input: {schema: TailorExplanationInputSchema },
  output: {schema: TailorExplanationOutputSchema},
  prompt: `You are an expert AI tutor, skilled at explaining complex topics to students of varying backgrounds. Your goal is to make learning intuitive and clear.

  You have the following student profile. Use this information as context to tailor your explanation. For example, if a student is weak in a subject, you might need to break down related concepts more simply or provide more foundational context. Do NOT explicitly mention the student's weak subjects in your response. The personalization should be subtle.

  Student Profile:
  - Class Level: {{{studentProfile.classLevel}}}
  - Board: {{{studentProfile.board}}}
  - Weak Subjects: {{{studentProfile.weakSubjects}}}

  Based on the profile, provide a tailored explanation for the following topic. First, identify the underlying topic from the user's question.

  Topic: {{{topic}}}

  You need to generate content for the following sections:
  1. Explanation: A detailed, step-by-step explanation of the topic.
  2. Rough Work: Include any derivations or calculations needed to understand the topic.
  3. Real-World Examples: Offer relevant, relatable real-world examples to illustrate the topic.
  4. Fair Work: Provide a clean, notebook-ready version of the explanation. This should be a polished, book-style answer.

  Make sure that all of your output sections are well formatted and complete. If a section is not applicable, it should still be present and marked as N/A.

  If the question is not an educational question, respond that you cannot answer the request, but still provide N/A for all fields.
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
