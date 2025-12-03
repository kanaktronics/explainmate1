'use server';
/**
 * @fileOverview Interactive quiz generation flow for students.
 *
 * - generateInteractiveQuizzes - A function that generates multiple-choice quizzes.
 * - GenerateInteractiveQuizzesInput - The input type for the generateInteractiveQuizzes function.
 * - GenerateInteractiveQuizzesOutput - The return type for the generateInteractiveQuizzes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StudentProfileSchema = z.object({
  classLevel: z.string().describe("The student's class level."),
  board: z.string().describe("The student's educational board."),
  weakSubjects: z
    .string()
    .describe('A comma-separated list of subjects the student finds weak.'),
});

const GenerateInteractiveQuizzesInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate the quiz.'),
  studentProfile: StudentProfileSchema.optional().describe(
    'The student profile to tailor the quiz difficulty and content.'
  ),
  numQuestions: z
    .number()
    .min(1)
    .max(15)
    .default(5)
    .describe('The number of multiple-choice questions to generate (1-15).'),
});
export type GenerateInteractiveQuizzesInput = z.infer<
  typeof GenerateInteractiveQuizzesInputSchema
>;

const GenerateInteractiveQuizzesOutputSchema = z.object({
  quiz: z
    .array(
      z.object({
        question: z.string().describe('The quiz question.'),
        options: z.array(z.string()).describe('The multiple-choice options.'),
        correctAnswer: z
          .string()
          .describe('The correct answer to the question.'),
        explanation: z
          .string()
          .optional()
          .describe('Explanation of why the answer is correct.'),
      })
    )
    .describe('A list of multiple-choice questions with options and answers.'),
});
export type GenerateInteractiveQuizzesOutput = z.infer<
  typeof GenerateInteractiveQuizzesOutputSchema
>;

export async function generateInteractiveQuizzes(
  input: GenerateInteractiveQuizzesInput
): Promise<GenerateInteractiveQuizzesOutput> {
  return generateInteractiveQuizzesFlow(input);
}

const quizPrompt = ai.definePrompt({
  name: 'quizPrompt',
  input: {schema: GenerateInteractiveQuizzesInputSchema},
  output: {schema: GenerateInteractiveQuizzesOutputSchema},
  prompt: `You are an expert quiz generator for middle and high school students.
Generate a multiple-choice quiz on the topic of {{topic}}, with {{numQuestions}} questions.
{{#if studentProfile}}
The quiz should be tailored to the student's profile:
- Class: {{studentProfile.classLevel}}
- Board: {{studentProfile.board}}
- Weak Subjects: {{studentProfile.weakSubjects}}
{{/if}}

Each question should have 4 options, and clearly indicate the correct answer.
Also generate a short explanation of why each answer is correct.

Your output should be a JSON object with a "quiz" field, which is an array of question objects. Each question object should have the following fields:
- "question": the text of the question
- "options": an array of 4 strings, representing the multiple-choice options
- "correctAnswer": a string, the correct answer to the question (must be one of the options)
- "explanation": a string, explaining why the answer is correct

Example:
{
  "quiz": [
    {
      "question": "What is the capital of France?",
      "options": ["Berlin", "Paris", "Rome", "Madrid"],
      "correctAnswer": "Paris",
      "explanation": "Paris is the capital city of France."
    },
   {
      "question": "What is the capital of Germany?",
      "options": ["Berlin", "Paris", "Rome", "Madrid"],
      "correctAnswer": "Berlin",
      "explanation": "Berlin is the capital city of Germany."
    }
  ]
}
`,
});

const generateInteractiveQuizzesFlow = ai.defineFlow(
  {
    name: 'generateInteractiveQuizzesFlow',
    inputSchema: GenerateInteractiveQuizzesInputSchema,
    outputSchema: GenerateInteractiveQuizzesOutputSchema,
  },
  async input => {
    const {output} = await quizPrompt(input);
    return output!;
  }
);
