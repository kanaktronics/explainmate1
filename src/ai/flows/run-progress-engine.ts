
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
  payload: z.any().optional().describe('Event-specific data, e.g., { correct: boolean, question: string, userAnswer: string, correctAnswer: string } for a quiz answer, or { chat: ChatMessage[] } for an explanation'),
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
        suggestion: z.string().describe('A short, actionable suggestion for improvement based on specific incorrect answers.'),
    })).describe('A list of topics where the student is weakest, with suggestions based on incorrect quiz answers.'),
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
      -   For 'overallAccuracyPercent': Calculate this by analyzing ONLY the 'quiz_answer' interactions. The formula is (total correct 'quiz_answer' events / total 'quiz_answer' events) * 100. Round to the nearest whole number. If there are NO 'quiz_answer' events, you MUST set this value to 0. Do not guess or use a default like 50.
      -   For 'weakTopics': This is the most important part. You must analyze the 'quiz_answer' interactions where 'payload.correct' is false. Look for patterns in the *incorrect* answers. For example, if the student consistently gets questions wrong about 'calculating the area of a sector' within the broader topic of 'Circles', then the weak topic is 'Area of a Sector', not just 'Circles'. The suggestion must be highly specific and actionable, e.g., "Focus on reviewing the formula for the area of a sector and practice with 2-3 examples." Do NOT give a generic suggestion like "Review Circles". Calculate the accuracy for each weak topic based on all answers for that specific topic.
      -   For 'topTopics': List the 3-5 *true topics* with the most interactions of any type.

  3.  **Generate Meaningful 7-Day Plan**:
      -   Create a sevenDayPlan focusing on one of the identified weakTopics.
      -   The plan must be structured logically. Day 1 should be a brief review ('explain') of the specific weakness. Day 2 should be practice problems ('practice'). Day 3 should be a 'quiz' on that specific sub-topic. Days 4-7 can build on this or introduce related concepts.
      -   Task text must be very concise (<= 150 chars) and relevant to the *true topic*. For example, "Review the formula for calculating the area of a circle."
      -   Keep estimatedMinutes for each day low (5-15 mins).

  4.  **Output Format**:
      -   The final output MUST be a JSON object matching the ProgressEngineOutput schema.
      -   computedAt must be the current ISO 8601 timestamp.
      -   If interaction data is sparse (e.g., fewer than 5 interactions), you can add a note in the 'notes' field like "Results are based on limited data. Interact more to get a more accurate report."
      -   Do not generate a 7-day plan if there isn't a clear weak topic identified from quiz answers.`,
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
