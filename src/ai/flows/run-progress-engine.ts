
'use server';
/**
 * @fileOverview Analyzes student interaction history to generate a progress report and a 7-day adaptive learning plan.
 *
 * - runProgressEngine - The main function to call the progress analysis flow.
 * - ProgressEngineInput - The input type for the flow.
 * - ProgressEngineOutput - The output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InteractionSchema = z.object({
  id: z.string(),
  timestamp: z.string().describe('ISO 8601 timestamp of the event'),
  type: z.enum(['explanation', 'quiz_start', 'quiz_answer', 'teacher_companion_chat']),
  topic: z.string().describe('The topic of the interaction'),
  payload: z.any().optional().describe('Event-specific data, e.g., { correct: boolean, timeSpentSeconds: number } for a quiz answer'),
});

const ProgressEngineInputSchema = z.object({
  studentId: z.string(),
  interactions: z.array(InteractionSchema).describe('A list of recent student interactions.'),
  languagePreference: z.enum(['en', 'hinglish', 'hi']).default('en'),
});
export type ProgressEngineInput = z.infer<typeof ProgressEngineInputSchema>;

const ProgressEngineOutputSchema = z.object({
    computedAt: z.string().describe('ISO 8601 timestamp of when the analysis was computed.'),
    totalMinutesAllTime: z.number().describe('Estimated total minutes spent learning on the platform.'),
    minutesLast7Days: z.number().describe('Total minutes spent in the last 7 days.'),
    overallAccuracyPercent: z.number().describe('Overall percentage of correct quiz answers.'),
    overallProgressPercent: z.number().describe('A composite score representing overall progress.'),
    progressGrowth: z.array(z.object({
        date: z.string().describe('Date in YYYY-MM-DD format.'),
        progress: z.number().describe('Overall progress percentage for that day.'),
    })).describe('A list of progress snapshots for the last 7 days.'),
    topTopics: z.array(z.string()).describe('A list of the most frequently interacted with topics.'),
    weakTopics: z.array(z.object({
        topic: z.string(),
        accuracy: z.number(),
        suggestion: z.string().describe('A short, actionable suggestion for improvement.'),
    })).describe('A list of topics where the student is weakest.'),
    sevenDayPlan: z.array(z.object({
        day: z.number(),
        estimatedMinutes: z.number(),
        tasks: z.array(z.object({
            type: z.enum(['explain', 'practice', 'quiz']),
            topic: z.string(),
            text: z.string().describe('A short description of the micro-lesson.'),
        })),
    })).describe('A 7-day adaptive learning plan.'),
    notes: z.string().optional().describe('Any notes about the computation, e.g., if data was partial.'),
});
export type ProgressEngineOutput = z.infer<typeof ProgressEngineOutputSchema>;


export async function runProgressEngine(input: ProgressEngineInput): Promise<ProgressEngineOutput> {
  return runProgressEngineFlow(input);
}


const progressPrompt = ai.definePrompt({
  name: 'progressEnginePrompt',
  input: { schema: z.object({ interactionsJson: z.string() }) },
  output: { schema: ProgressEngineOutputSchema },
  prompt: `You are an expert student progress analyst. Your task is to analyze a student's recent interactions and generate a comprehensive progress report and a 7-day learning plan.

  Analyze the following student interactions (JSON format):
  {{{interactionsJson}}}

  Follow these rules precisely:
  1.  **Calculate Stats**:
      -   \`totalMinutesAllTime\` and \`minutesLast7Days\`: Estimate from the timestamps. Assume each 'explanation' or 'teacher_companion_chat' is 3 minutes. For quizzes, sum the \`timeSpentSeconds\` from the payload.
      -   \`overallAccuracyPercent\`: Calculate from 'quiz_answer' interactions. (correct answers / total answers) * 100.
      -   \`weakTopics\`: Identify topics with the lowest accuracy (below 60%) or high frequency of 'explanation' events without follow-up correct quiz answers. Provide a short, actionable \`suggestion\` for each.
      -   \`topTopics\`: List the 3-5 topics with the most interactions.
      -   \`overallProgressPercent\`: A composite score. Roughly 60% based on accuracy, 20% on the number of unique topics studied (variety), and 20% on recent activity (minutesLast7Days).
      -   \`progressGrowth\`: Create a 7-day history of the \`overallProgressPercent\`. You will need to calculate this score for each of the past 7 days based on the interactions that occurred up to that day.

  2.  **Generate 7-Day Plan**:
      -   Create a \`sevenDayPlan\` focusing on the identified \`weakTopics\`.
      -   Each day should have 1-2 micro-tasks ('explain', 'practice', 'quiz').
      -   Keep \`estimatedMinutes\` for each day low (5-10 mins).
      -   Task \`text\` must be very concise (<= 150 chars).

  3.  **Output Format**:
      -   The final output MUST be a JSON object matching the ProgressEngineOutput schema.
      -   \`computedAt\` must be the current ISO 8601 timestamp.
      -   If interaction data is sparse, provide sensible defaults (e.g., accuracy 50%), list 1-2 weak topics based on what little data you have, and add a \`notes\` field explaining that the results are estimated due to limited data.`,
});

const runProgressEngineFlow = ai.defineFlow(
  {
    name: 'runProgressEngineFlow',
    inputSchema: ProgressEngineInputSchema,
    outputSchema: ProgressEngineOutputSchema,
  },
  async (input) => {
    const interactionsJson = JSON.stringify(input.interactions);
    const { output } = await progressPrompt({ interactionsJson });
    return output!;
  }
);
