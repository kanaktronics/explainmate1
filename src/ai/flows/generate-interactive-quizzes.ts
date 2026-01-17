
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

const QuestionSchema = z.object({
    type: z.enum(['MCQ', 'TrueFalse', 'AssertionReason', 'FillInTheBlanks', 'ShortAnswer']).describe('The type of question.'),
    question: z.string().optional().describe('The main question text or instruction. For FillInTheBlanks, this should include a `___` marker.'),
    assertion: z.string().optional().describe('The assertion text for Assertion-Reason questions. MANDATORY for this type. HARD LIMIT: 150 characters.'),
    reason: z.string().optional().describe("The reason text for Assertion-Reason questions. MANDATORY for this type. HARD LIMIT: 150 characters & max 1-2 lines. It must be a direct factual statement. DO NOT add notes, meta-commentary, or repeat phrases."),
    options: z.array(z.string()).optional().describe('An array of options for MCQ, True/False, and Assertion-Reason questions. MANDATORY for these types.'),
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


const singleQuestionPrompt = ai.definePrompt({
    name: 'generateSingleQuestionPrompt',
    input: { schema: z.object({
        topic: z.string(),
        studentProfile: StudentProfileSchema.optional(),
        difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
        questionType: z.enum(['MCQ', 'TrueFalse', 'AssertionReason', 'FillInTheBlanks', 'ShortAnswer']),
    })},
    output: { schema: QuestionSchema },
    prompt: `You are an expert quiz generator. Your task is to create ONE SINGLE question based on the exact format requested.

    Generate ONE question on the topic of **{{topic}}** of type **{{questionType}}**.

    **Student Context:**
    {{#if studentProfile}}
    - Class: {{studentProfile.classLevel}}
    - Board: {{studentProfile.board}}
    {{/if}}
    {{#if difficulty}}
    - Difficulty: {{difficulty}}
    {{/if}}

    **CRITICAL RULES:**
    1.  **Question Type**: You MUST generate exactly ONE question of the type **{{questionType}}**.
    2.  **Curriculum Alignment**: The question must be strictly aligned with the student's class and board curriculum.
    3.  **Strict Output Format**: Your entire output must be a single JSON object matching the provided Zod schema for the question.

    **QUESTION TYPE FORMATS:**
    
    1.  **MCQ (Single Correct)**:
        -   \`type\`: "MCQ"
        -   \`question\`: The question text.
        -   \`options\`: MANDATORY. An array of 4 **distinct** strings. Incorrect options must be plausible distractors.
        -   \`correctAnswer\`: The text of the single correct option.
        -   \`explanation\`: A brief, one-line explanation of why the answer is correct.

    2.  **True / False**:
        -   \`type\`: "TrueFalse"
        -   \`question\`: The statement to be evaluated.
        -   \`options\`: MANDATORY. Must be \`["True", "False"]\`.
        -   \`correctAnswer\`: Either "True" or "False".
        -   \`explanation\`: A brief, one-line reason why the statement is true or false.

    3.  **Assertion – Reason**:
        -   \`type\`: "AssertionReason"
        -   \`question\`: This field MUST be an empty string: \`""\`.
        -   \`assertion\`: A single, concise assertion statement. MANDATORY. HARD LIMIT: 150 characters.
        -   \`reason\`: A single, concise reason statement. MANDATORY. HARD LIMIT: 150 characters & max 1-2 lines. It must be a direct factual statement, not a long explanation.
        -   \`options\`: MANDATORY. Must be the standard 4 A/R options: ["Both Assertion (A) and Reason (R) are true and Reason (R) is the correct explanation of Assertion (A).", "Both Assertion (A) and Reason (R) are true but Reason (R) is not the correct explanation of Assertion (A).", "Assertion (A) is true but Reason (R) is false.", "Assertion (A) is false but Reason (R) is true."]
        -   \`correctAnswer\`: The full text of the correct option.
        -   \`explanation\`: A one-line justification for the correct A/R relationship.

    4.  **Fill in the Blanks**:
        -   \`type\`: "FillInTheBlanks"
        -   \`question\`: The sentence with a blank, represented by \`___\`.
        -   \`correctAnswer\`: The word or short phrase that fills the blank.
        -   \`explanation\`: A one-line reason why that word is correct.

    5.  **Short Answer**:
        -   \`type\`: "ShortAnswer"
        -   \`question\`: The question that requires a brief written response.
        -   \`correctAnswer\`: A model answer, 2-3 lines long.
        -   \`explanation\`: A one-line summary of the key points.

    Generate the JSON output for ONE question of type {{questionType}} now.
    `,
});


const generateInteractiveQuizzesFlow = ai.defineFlow(
  {
    name: 'generateInteractiveQuizzesFlow',
    inputSchema: GenerateInteractiveQuizzesInputSchema,
    outputSchema: GenerateInteractiveQuizzesOutputSchema,
  },
  async input => {
    const quiz: z.infer<typeof QuestionSchema>[] = [];
    const allQuestionTypes: ('MCQ' | 'TrueFalse' | 'AssertionReason' | 'FillInTheBlanks' | 'ShortAnswer')[] = ['MCQ', 'TrueFalse', 'FillInTheBlanks', 'ShortAnswer', 'AssertionReason'];

    for (let i = 0; i < input.numQuestions; i++) {
        let questionType: ('MCQ' | 'TrueFalse' | 'AssertionReason' | 'FillInTheBlanks' | 'ShortAnswer');
        
        if (input.questionType && input.questionType !== 'Mixed') {
            questionType = input.questionType;
        } else {
            // Cycle through types for a mixed quiz
            questionType = allQuestionTypes[i % allQuestionTypes.length];
        }

        let attempts = 0;
        let success = false;
        while(attempts < 2 && !success) {
            try {
                const { output } = await singleQuestionPrompt({
                    topic: input.topic,
                    studentProfile: input.studentProfile,
                    difficulty: input.difficulty,
                    questionType: questionType
                });

                if (output) {
                    // Perform validation based on the question type
                    let isValid = true;
                    if(output.type === 'MCQ' && (!output.options || output.options.length < 4)) {
                        isValid = false;
                    } else if (output.type === 'AssertionReason' && (!output.assertion || !output.reason || output.assertion.length === 0 || output.reason.length === 0)) {
                        isValid = false;
                    } else if (output.type === 'TrueFalse' && (!output.options || output.options.length < 2)) {
                        isValid = false;
                    }

                    if (isValid) {
                        quiz.push(output);
                        success = true;
                    } else {
                         // This will trigger a retry
                        throw new Error(`Generated ${questionType} question failed basic validation.`);
                    }
                }
            } catch (e) {
                console.error(`Attempt ${attempts + 1} failed for question type ${questionType}:`, e);
            }
            attempts++;
        }

        if (!success) {
            // If after all retries, we still couldn't generate a valid question, throw an error.
            throw new Error(`The AI failed to generate a valid '${questionType}' question for the topic "${input.topic}". Please try again or with a different topic.`);
        }
    }

    if (quiz.length < input.numQuestions) {
        throw new Error("The AI could not generate the requested number of questions after multiple retries. Please try again.");
    }

    return { quiz };
  }
);

    