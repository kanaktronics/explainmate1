
'use server';
/**
 * @fileOverview Generates a comprehensive exam preparation plan and a sample paper.
 *
 * - generateExamPlan - A function that handles the generation of the exam plan.
 * - GenerateExamPlanInput - The input type for the generateExamPlan function.
 * - GenerateExamPlanOutput - The return type for the generateExamPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StudentProfileSchema = z.object({
  classLevel: z.string().describe("The student's class level."),
  board: z.string().describe("The student's educational board (e.g., CBSE, ICSE)."),
});

const GenerateExamPlanInputSchema = z.object({
  subject: z.string().describe('The subject for the exam.'),
  examDate: z.string().describe('The date of the exam in ISO 8601 format.'),
  currentDate: z.string().describe('The current date in ISO 8601 format, to calculate the number of days until the exam.'),
  studentProfile: StudentProfileSchema.describe('The profile of the student.'),
});
export type GenerateExamPlanInput = z.infer<typeof GenerateExamPlanInputSchema>;

const TaskSchema = z.object({
  type: z.enum(['explanation', 'quiz', 'revision', 'practice']).describe('The type of study task.'),
  topic: z.string().describe('The specific topic for the task.'),
  duration: z.number().describe('Estimated duration in minutes for the task.'),
});

const RoadmapDaySchema = z.object({
  day: z.number().describe('The day number in the plan (e.g., Day 1).'),
  dailyGoal: z.string().describe('A short goal for the day.'),
  tasks: z.array(TaskSchema).describe('A list of tasks for the day.'),
});

const QuestionSchema = z.object({
  question: z.string().describe('The question text.'),
  marks: z.number().describe('The marks allocated for the question.'),
  answer: z.string().optional().describe('A model answer for the question.'),
});

const SamplePaperSchema = z.object({
  title: z.string().describe('The title of the sample paper (e.g., "CBSE Class 10 Science Sample Paper").'),
  totalMarks: z.number().describe('The total marks for the paper.'),
  duration: z.number().describe('The duration of the exam in minutes.'),
  sections: z.array(z.object({
    title: z.string().describe('The title of the section (e.g., "Section A: Multiple Choice Questions").'),
    questions: z.array(QuestionSchema).describe('A list of questions in this section.'),
  })).describe('The different sections of the sample paper.'),
});

const GenerateExamPlanOutputSchema = z.object({
  roadmap: z.array(RoadmapDaySchema).describe('A day-by-day study roadmap leading up to the exam.'),
  samplePaper: SamplePaperSchema.describe('A full-length sample paper based on the curriculum.'),
});
export type GenerateExamPlanOutput = z.infer<typeof GenerateExamPlanOutputSchema>;


export async function generateExamPlan(
  input: GenerateExamPlanInput
): Promise<GenerateExamPlanOutput> {
  return generateExamPlanFlow(input);
}

const examPlanPrompt = ai.definePrompt({
  name: 'examPlanPrompt',
  input: {schema: GenerateExamPlanInputSchema},
  output: {schema: GenerateExamPlanOutputSchema},
  prompt: `You are an expert academic planner for Indian students. Your task is to create a detailed, day-by-day study roadmap and a full-length sample question paper for a student preparing for an exam.

Student Profile:
- Class: {{studentProfile.classLevel}}
- Board: {{studentProfile.board}}

Exam Details:
- Subject: {{subject}}
- Today's Date: {{currentDate}}
- Exam Date: {{examDate}}

First, calculate the number of days from **today's date ({{currentDate}})** until the exam date to create a roadmap. The roadmap should be practical and cover all important topics. Each day should have a clear goal and a list of tasks (explanation, quiz, revision, practice) with estimated durations. Break down larger topics into smaller, manageable sub-topics. The final day should be for light revision only. Ensure the number of days in the roadmap accurately reflects the time between the current date and the exam date.

Second, generate a high-quality sample paper that strictly follows the pattern, syllabus, and difficulty level for the specified class and board. The paper must include a variety of question types:
- Multiple Choice Questions (MCQs)
- Very Short Answer Questions
- Short Answer Questions
- Long Answer Questions
- Case-Based or Assertion-Reason questions if applicable for the board and subject.

The sample paper must have clear sections, marks for each question, a total marks count, and the exam duration. Provide concise model answers for each question where applicable.

Generate the output as a single JSON object matching the defined output schema.
`,
});

const generateExamPlanFlow = ai.defineFlow(
  {
    name: 'generateExamPlanFlow',
    inputSchema: GenerateExamPlanInputSchema,
    outputSchema: GenerateExamPlanOutputSchema,
  },
  async input => {
    const {output} = await examPlanPrompt(input);
    return output!;
  }
);
