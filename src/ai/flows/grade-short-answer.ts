
'use server';
/**
 * @fileOverview Grades a student's short answer by comparing it semantically to a model answer.
 *
 * - gradeShortAnswer - A function that handles the grading.
 * - GradeShortAnswerInput - The input type for the function.
 * - GradeShortAnswerOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GradeShortAnswerInputSchema = z.object({
  question: z.string().describe('The question that was asked.'),
  modelAnswer: z.string().describe('The ideal or correct answer to the question.'),
  userAnswer: z.string().describe("The student's submitted answer."),
});
export type GradeShortAnswerInput = z.infer<typeof GradeShortAnswerInputSchema>;

const GradeShortAnswerOutputSchema = z.object({
  isCorrect: z.boolean().describe('Whether the user\'s answer is semantically correct when compared to the model answer.'),
  feedback: z.string().describe('A concise explanation for why the answer is correct or incorrect, highlighting key concepts the user missed or got right.'),
});
export type GradeShortAnswerOutput = z.infer<typeof GradeShortAnswerOutputSchema>;

export async function gradeShortAnswer(
  input: GradeShortAnswerInput
): Promise<GradeShortAnswerOutput> {
  return gradeShortAnswerFlow(input);
}

const gradingPrompt = ai.definePrompt({
  name: 'gradeShortAnswerPrompt',
  input: {schema: GradeShortAnswerInputSchema},
  output: {schema: GradeShortAnswerOutputSchema},
  prompt: `You are an expert examiner. Your task is to grade a student's short answer based on its conceptual correctness, not just on exact wording.

  Question: "{{question}}"
  
  Model Answer (The ideal response): "{{modelAnswer}}"
  
  Student's Answer: "{{userAnswer}}"

  **Instructions:**
  1.  **Analyze and Compare**: Read the student's answer and compare it to the model answer. Identify the key concepts.
  2.  **Determine Correctness**: Decide if the student's answer is fundamentally correct, even if it uses different words or phrasing. It should capture the main idea of the model answer.
  3.  **Set 'isCorrect'**:
      -   Set \`isCorrect\` to \`true\` if the student's answer is conceptually right.
      -   Set \`isCorrect\` to \`false\` if it is conceptually wrong, misses the main point, or is too vague.
  4.  **Provide Feedback**:
      -   **If Correct**: Write a brief, encouraging feedback message confirming they are on the right track. Example: "Excellent! You correctly identified the main point."
      -   **If Incorrect**: Write a concise, helpful feedback message. Explain *why* it's incorrect by pointing out what key concept was missed or misunderstood. Do NOT just repeat the model answer. Guide them toward the correct understanding. Example: "Good attempt, but you missed the key point about... The model answer includes this."
  
  Your entire output must be a single JSON object matching the defined output schema.
  `,
});

const gradeShortAnswerFlow = ai.defineFlow(
  {
    name: 'gradeShortAnswerFlow',
    inputSchema: GradeShortAnswerInputSchema,
    outputSchema: GradeShortAnswerOutputSchema,
  },
  async (input) => {
    const {output} = await gradingPrompt(input);
    return output!;
  }
);
