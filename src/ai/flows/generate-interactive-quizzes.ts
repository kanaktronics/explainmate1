
'use server';
/**
 * @fileOverview Interactive quiz generation flow for students.
 *
 * - generateInteractiveQuizzes - A function that generates a mixed-format quiz.
 * - GenerateInteractiveQuizzesInput - The input type for the generateInteractiveQuizzes function.
 * - GenerateInteractiveQuizzesOutput - The return type for the generateInteractiveQuizzes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

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
    .describe('The number of questions to generate (1-15).'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional().describe('The difficulty level of the quiz.'),
  questionType: z.enum(['Mixed', 'MCQ', 'TrueFalse', 'AssertionReason', 'FillInTheBlanks', 'ShortAnswer']).optional().describe('The specific type of questions to generate.'),
});
export type GenerateInteractiveQuizzesInput = z.infer<
  typeof GenerateInteractiveQuizzesInputSchema
>;

const InternalPromptInputSchema = GenerateInteractiveQuizzesInputSchema.extend({
    questionTypeInstruction: z.string(),
});

const QuestionSchema = z.object({
    type: z.enum(['MCQ', 'TrueFalse', 'AssertionReason', 'FillInTheBlanks', 'ShortAnswer']).describe('The type of question.'),
    question: z.string().optional().describe('The main question text or instruction. For FillInTheBlanks, this should include a `___` marker.'),
    assertion: z.string().optional().describe('The assertion text for Assertion-Reason questions.'),
    reason: z.string().optional().describe('The reason text for Assertion-Reason questions.'),
    options: z.array(z.string()).optional().describe('An array of options for MCQ questions.'),
    correctAnswer: z.string().describe('The correct answer. For True/False, it is "True" or "False". For FillInTheBlanks, it is the word/phrase to fill in. For ShortAnswer, it is a model answer.'),
    explanation: z.string().describe('A brief, one-line explanation of why the answer is correct.'),
});

const GenerateInteractiveQuizzesOutputSchema = z.object({
  quiz: z
    .array(QuestionSchema)
    .describe('An array of quiz questions in various formats.'),
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
  input: {schema: InternalPromptInputSchema},
  output: {schema: GenerateInteractiveQuizzesOutputSchema},
  prompt: `You are an expert quiz generator for Indian middle and high school students. Your task is to create a quiz with a variety of question types that are relevant to the student's curriculum and simulate real exam practice.

Generate a quiz on the topic of **{{topic}}** with **{{numQuestions}}** questions.

**Student Context:**
{{#if studentProfile}}
- Class: {{studentProfile.classLevel}}
- Board: {{studentProfile.board}}
- Weak Subjects: {{studentProfile.weakSubjects}}
{{/if}}
{{#if difficulty}}
- Difficulty: {{difficulty}}
{{/if}}

**CRITICAL RULES:**
1.  **Question Type**:
    {{{questionTypeInstruction}}}
2.  **Curriculum Alignment**: All questions must be strictly aligned with the student's class and board curriculum.
3.  **No Hallucination**: If you are unsure about a fact or concept for a given curriculum, do not invent it. Skip that question and create a different one.
4.  **Test Understanding**: Questions must test conceptual understanding, not just rote memorization.
5.  **Strict Output Format**: Your entire output must be a single JSON object matching the provided Zod schema. Each question object in the "quiz" array must conform to the specified structure for its type.

**QUESTION TYPE FORMATS:**

1.  **MCQ (Single Correct)**:
    -   \`type\`: "MCQ"
    -   \`question\`: The question text.
    -   \`options\`: An array of 4 strings.
    -   \`correctAnswer\`: The correct option's text.
    -   \`explanation\`: A one-line reason why the answer is correct.

2.  **True / False**:
    -   \`type\`: "TrueFalse"
    -   \`question\`: The statement to be evaluated.
    -   \`options\`: Must be \`["True", "False"]\`.
    -   \`correctAnswer\`: Either "True" or "False".
    -   \`explanation\`: A one-line reason why the statement is true or false.

3.  **Assertion – Reason**:
    -   \`type\`: "AssertionReason"
    -   \`question\`: This field MUST be an empty string: \`""\`.
    -   \`assertion\`: A single, concise assertion statement (max 150 characters).
    -   \`reason\`: A single, concise reason statement (max 150 characters). It must NOT be a repeated phrase.
    -   \`options\`: Must be the standard 4 A/R options:
        -   "Both Assertion (A) and Reason (R) are true and Reason (R) is the correct explanation of Assertion (A)."
        -   "Both Assertion (A) and Reason (R) are true but Reason (R) is not the correct explanation of Assertion (A)."
        -   "Assertion (A) is true but Reason (R) is false."
        -   "Assertion (A) is false but Reason (R) is true."
    -   \`correctAnswer\`: The full text of the correct option.
    -   \`explanation\`: A one-line justification for the correct A/R relationship.

4.  **Fill in the Blanks**:
    -   \`type\`: "FillInTheBlanks"
    -   \`question\`: The sentence with a blank, represented by \`___\`. Example: "The powerhouse of the cell is the ___."
    -   \`options\`: This field must be omitted.
    -   \`correctAnswer\`: The word or short phrase that fills the blank. Example: "mitochondria".
    -   \`explanation\`: A one-line reason why that word is correct.

5.  **Short Answer**:
    -   \`type\`: "ShortAnswer"
    -   \`question\`: The question that requires a brief written response.
    -   \`options\`: This field must be omitted.
    -   \`correctAnswer\`: A model answer, 2-3 lines long, as would be expected in an exam.
    -   \`explanation\`: A one-line summary of the key points the answer should contain.

Generate the JSON output now.
`,
});


const generateInteractiveQuizzesFlow = ai.defineFlow(
  {
    name: 'generateInteractiveQuizzesFlow',
    inputSchema: GenerateInteractiveQuizzesInputSchema,
    outputSchema: GenerateInteractiveQuizzesOutputSchema,
  },
  async input => {
    let questionTypeInstruction = '';

    if (input.questionType && input.questionType !== 'Mixed') {
        questionTypeInstruction = `You MUST generate ONLY questions of the type **'${input.questionType}'**.`;
    } else {
        questionTypeInstruction = `If generating multiple questions, you MUST include a mix of the following types based on what is most suitable for the topic: 'MCQ', 'TrueFalse', 'AssertionReason', 'FillInTheBlanks', and 'ShortAnswer'. Do not just generate MCQs.`;
    }

    const promptInput = {
      ...input,
      questionTypeInstruction,
    };

    const {output} = await quizPrompt(promptInput);
    return output!;
  }
);
