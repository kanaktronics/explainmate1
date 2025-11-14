'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating educational explanations tailored to a student's profile.
 *
 * The flow takes a topic and student profile as input and returns a detailed explanation, rough work derivations,
 * and real-world examples, formatted for a tabbed interface.
 *
 * - generateExplanation - The main function to generate the explanation.
 * - GenerateExplanationInput - The input type for the generateExplanation function.
 * - GenerateExplanationOutput - The return type for the generateExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExplanationInputSchema = z.object({
  topic: z.string().describe('The topic for which an explanation is to be generated.'),
  studentProfile: z
    .object({
      class: z.string().describe('The student\'s class (e.g., 10th grade).'),
      board: z.string().describe('The student\'s educational board (e.g., CBSE, ICSE).'),
      weakSubjects: z
        .string()
        .describe('Comma-separated list of subjects the student finds challenging.'),
    })
    .describe('The profile of the student for whom the explanation is being generated.'),
});
export type GenerateExplanationInput = z.infer<typeof GenerateExplanationInputSchema>;

const GenerateExplanationOutputSchema = z.object({
  explanation: z.string().describe('A detailed, step-by-step explanation of the topic.'),
  roughWork: z.string().describe('Rough work derivations related to the topic.'),
  realWorldExamples: z
    .string()
    .describe('Real-world examples that help illustrate the topic.'),
});
export type GenerateExplanationOutput = z.infer<typeof GenerateExplanationOutputSchema>;

export async function generateExplanation(
  input: GenerateExplanationInput
): Promise<GenerateExplanationOutput> {
  return generateExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExplanationPrompt',
  input: {schema: GenerateExplanationInputSchema},
  output: {schema: GenerateExplanationOutputSchema},
  prompt: `You are an AI tutor specializing in creating educational content for middle and high school students.

  Your goal is to provide clear, engaging, and personalized explanations on a given topic.
  You will tailor the explanation based on the student's profile, including their class, board, and weak subjects.

  Here's the student's profile:
  Class: {{{studentProfile.class}}}
  Board: {{{studentProfile.board}}}
  Weak Subjects: {{{studentProfile.weakSubjects}}}

  Topic: {{{topic}}}

  Instructions:
  1.  Explanation: Provide a detailed, step-by-step explanation of the topic.
  2.  Rough Work: Include any derivations or calculations needed to understand the topic.
  3.  Real-World Examples: Offer relevant, relatable real-world examples to illustrate the topic.

  Format your response as follows:
  Explanation: [Detailed explanation]
  Rough Work: [Derivations and calculations]
  Real-World Examples: [Examples illustrating the topic]`,
});

const generateExplanationFlow = ai.defineFlow(
  {
    name: 'generateExplanationFlow',
    inputSchema: GenerateExplanationInputSchema,
    outputSchema: GenerateExplanationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
