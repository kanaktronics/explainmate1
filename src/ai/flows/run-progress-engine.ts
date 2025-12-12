
'use server';
/**
 * @fileOverview Analyzes student interaction history to generate a progress report and a 7-day adaptive learning plan.
 *
 * - runProgressEngine - The main function to call the progress analysis flow.
 * - ProgressEngineInput - The input type for the flow.
 * - ProgressEngineOutput - The output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const InteractionSchema = z.object({
  id: z.string(),
  timestamp: z.string().describe('ISO 8601 timestamp of the event'),
  type: z.enum(['explanation', 'quiz_start', 'quiz_answer', 'teacher_companion_chat']),
  topic: z.string().describe('The topic of the interaction'),
  payload: z.any().optional().describe('Event-specific data, e.g., { correct: boolean, timeSpentSeconds: number } for a quiz answer, or { chat: ChatMessage[] } for an explanation'),
});

const ProgressEngineInputSchema = z.object({
  studentId: z.string(),
  interactions: z.array(InteractionSchema).describe('A list of recent student interactions.'),
  languagePreference: z.enum(['en', 'hinglish', 'hi']).default('en'),
});
export type ProgressEngineInput = z.infer<typeof ProgressEngineInputSchema>;

const ProgressEngineOutputSchema = z.object({
    computedAt: z.string().describe('ISO 8601 timestamp of when the analysis was computed.'),
    overallAccuracyPercent: z.number().describe('Overall percentage of correct quiz answers.'),
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
  1.  **Identify True Topics**: The 'topic' field in the events can be messy (e.g., "hi", "what is this", "Introduction"). Your first and most important job is to look inside the 'payload.chat' array for 'explanation' events. Read the conversation to determine the *actual* academic subject (e.g., "Photosynthesis", "Newton's Laws of Motion", "Circle Congruency"). Group all related events under this true topic. Ignore conversational filler.

  2.  **Calculate Stats**:
      -   For 'overallAccuracyPercent': Calculate from 'quiz_answer' interactions. (correct answers / total answers) * 100. If no quizzes, default to 50.
      -   For 'weakTopics': Identify topics with the lowest accuracy (below 60%) or high frequency of 'explanation' events without follow-up correct quiz answers. The suggestion must be actionable and relevant to the *true topic*.
      -   For 'topTopics': List the 3-5 *true topics* with the most interactions.

  3.  **Generate Meaningful 7-Day Plan**:
      -   Create a sevenDayPlan focusing on one of the identified weakTopics.
      -   The plan must be structured logically. Day 1 should be a brief review ('explain'). Day 2 should be practice problems ('practice'). Day 3 should be a 'quiz'. Days 4-7 can build on this or introduce related concepts.
      -   Task text must be very concise (<= 150 chars) and relevant to the *true topic*. For example, "Review the formula for calculating the area of a circle."
      -   Keep estimatedMinutes for each day low (5-15 mins).

  4.  **Output Format**:
      -   The final output MUST be a JSON object matching the ProgressEngineOutput schema.
      -   computedAt must be the current ISO 8601 timestamp.
      -   If interaction data is sparse, provide sensible defaults (e.g., accuracy 50%), identify 1-2 weak topics based on the chat content, and add a notes field explaining that the results are estimated due to limited data. Do not make up a 7-day plan if there isn't a clear weak topic.`,
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
