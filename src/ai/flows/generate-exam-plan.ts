
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
import { differenceInDays } from 'date-fns';

const StudentProfileSchema = z.object({
  classLevel: z.string().describe("The student's class level."),
  board: z.string().describe("The student's educational board (e.g., CBSE, ICSE)."),
  isPro: z.boolean().describe('Whether the student is a Pro user.'),
});

const GenerateExamPlanInputSchema = z.object({
  subject: z.string().describe('The subject for the exam.'),
  topics: z.array(z.string()).describe('A list of specific topics selected by the user to focus on.'),
  examDate: z.string().describe('The date of the exam in ISO 8601 format.'),
  currentDate: z.string().describe('The current date in ISO 8601 format, to calculate the number of days until the exam.'),
  studentProfile: StudentProfileSchema.describe('The profile of the student.'),
});
export type GenerateExamPlanInput = z.infer<typeof GenerateExamPlanInputSchema>;

// Internal schema used by the prompt, which includes the calculated days
const InternalPromptInputSchema = GenerateExamPlanInputSchema.extend({
    daysUntilExam: z.number().describe('The exact number of days available for the study plan.'),
});

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
  samplePaper: SamplePaperSchema.optional().describe('A full-length sample paper based on the curriculum. This is ONLY generated if the user is a pro member.'),
});
export type GenerateExamPlanOutput = z.infer<typeof GenerateExamPlanOutputSchema>;


export async function generateExamPlan(
  input: GenerateExamPlanInput
): Promise<GenerateExamPlanOutput> {
  return generateExamPlanFlow(input);
}

const examPlanPrompt = ai.definePrompt({
  name: 'examPlanPrompt',
  input: {schema: InternalPromptInputSchema},
  output: {schema: GenerateExamPlanOutputSchema},
  prompt: `You are an expert academic planner for Indian students. Your task is to create a detailed, day-by-day study roadmap and, if requested, a full-length sample question paper.

Student Profile:
- Class: {{studentProfile.classLevel}}
- Board: {{studentProfile.board}}
- Pro User: {{studentProfile.isPro}}

Exam Details:
- Subject: {{subject}}
- Selected Topics: {{#each topics}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- Days until exam: {{daysUntilExam}}

PART 1: ROADMAP GENERATION (MANDATORY)
CRITICAL INSTRUCTION: You MUST create a study roadmap that has exactly **{{daysUntilExam}}** days. For example, if there is 1 day, create a 1-day plan. If there are 10 days, create a 10-day plan. DO NOT add more or fewer days.

The roadmap should ONLY cover the **selected topics**: {{#each topics}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}. Be practical and cover all these topics within the available days. Each day should have a clear goal and a list of tasks (explanation, quiz, revision, practice) with estimated durations. The final day should be for light revision only.

For subjects like 'Science', the plan must be balanced, covering topics from Physics, Chemistry, and Biology, based on the selected topics.

PART 2: SAMPLE PAPER GENERATION (PRO USERS ONLY)
{{#if studentProfile.isPro}}
Second, because this is a Pro user, you MUST generate a high-quality sample paper. The paper must strictly follow the pattern, syllabus, and difficulty level for the specified class and board, but ONLY include questions from the **selected topics**. The paper must include a variety of question types:
- Multiple Choice Questions (MCQs)
- Very Short Answer Questions
- Short Answer Questions
- Long Answer Questions
- Case-Based or Assertion-Reason questions if applicable for the board and subject.

The sample paper must have clear sections, marks for each question, a total marks count, and the exam duration.

CRITICAL RULE FOR ANSWERS: You MUST provide model answers where applicable, and the length and detail of the answer MUST be appropriate for the marks allocated. This is the most important rule.
- For 1-mark questions (MCQs, Very Short Answer): The answer must be very brief and to the point.
- For 2 or 3-mark questions: Provide a more detailed answer with 2-3 distinct points, aiming for approximately 40-60 words.
- For 5-mark questions: You MUST provide a comprehensive, well-structured answer. For subjects like History or Biology, this means an introduction, a main body with paragraphs or bullet points explaining several key aspects, and a conclusion. The answer must be at least 100-120 words long and include diagrams, formulas, or equations where relevant. Do NOT provide short, superficial answers for high-mark questions.
{{/if}}

Generate the output as a single JSON object matching the defined output schema. If the user is not a pro member, the 'samplePaper' field should be omitted from the JSON output.
`,
});

const generateExamPlanFlow = ai.defineFlow(
  {
    name: 'generateExamPlanFlow',
    inputSchema: GenerateExamPlanInputSchema,
    outputSchema: GenerateExamPlanOutputSchema,
  },
  async input => {
    // Calculate the number of days available for the plan.
    const daysUntilExam = differenceInDays(new Date(input.examDate), new Date(input.currentDate)) + 1;

    // Ensure at least a 1-day plan is generated.
    const planDays = Math.max(1, daysUntilExam);

    const promptInput = {
        ...input,
        daysUntilExam: planDays,
    };

    const {output} = await examPlanPrompt(promptInput);
    return output!;
  }
);
