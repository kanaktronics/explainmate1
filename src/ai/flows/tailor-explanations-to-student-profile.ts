'use server';

/**
 * @fileOverview Tailors explanations to the student's profile, including class, board, and weak subjects.
 *
 * - tailorExplanation - A function that tailors explanations based on the student's profile.
 * - TailorExplanationInput - The input type for the tailorExplanation function.
 * - TailorExplanationOutput - The return type for the tailorExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ChatMessage, Explanation } from '@/lib/types';

const StudentProfileSchema = z.object({
  classLevel: z.string().describe('The class level of the student (e.g., 10th grade).'),
  board: z.string().describe('The educational board the student follows (e.g., CBSE, ICSE, State Board).'),
  weakSubjects: z.string().describe('Comma-separated list of subjects the student finds challenging.'),
});

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});


const TailorExplanationInputSchema = z.object({
  chatHistory: z.array(ChatMessageSchema).describe('The full conversation history between the user and the assistant.'),
  studentProfile: StudentProfileSchema,
});
export type TailorExplanationInput = z.infer<typeof TailorExplanationInputSchema>;

const TailorExplanationOutputSchema = z.object({
  explanation: z.string().describe('The tailored explanation for the given topic, student profile and question.'),
  roughWork: z.string().describe('Rough work derivations related to the explanation.'),
  realWorldExamples: z.string().describe('Real-world examples to illustrate the explanation.'),
  fairWork: z.string().describe('Fair work, alternative explanation in a clean, notebook-ready format.'),
});
export type TailorExplanationOutput = z.infer<typeof TailorExplanationOutputSchema>;

export async function tailorExplanation(input: TailorExplanationInput): Promise<TailorExplanationOutput> {
  // We need to transform the incoming chat history to match what the prompt expects.
  // The prompt expects the 'assistant' role's content to be a JSON string of the Explanation object.
  // The incoming `chatHistory` from the client has the assistant content as an object, not a string.
  const transformedHistory = input.chatHistory.map(message => {
    if (message.role === 'assistant' && typeof message.content !== 'string') {
      // This is a special case for the 'assistant' role. The prompt expects a stringified JSON.
      // But the type from the client is an object. So we stringify it here.
      // This is a bit of a hack and ideally the types should be consistent.
      // The z.infer of ChatMessageSchema expects content to be a string.
      // But client-side ChatMessage can have content as an Explanation object.
      return { ...message, content: JSON.stringify(message.content) };
    }
    return message;
  });

  return tailorExplanationFlow({ ...input, chatHistory: transformedHistory as any });
}

const prompt = ai.definePrompt({
  name: 'tailorExplanationPrompt',
  input: {schema: TailorExplanationInputSchema },
  output: {schema: TailorExplanationOutputSchema},
  prompt: `You are ExplainMate, a friendly and expert AI tutor. Your goal is to make learning intuitive and clear for middle and high school students. You explain concepts with detailed, step-by-step explanations, rough work derivations, and real-world examples.

  MEMORY RULES (Current Session Only):
  1.  Conversation Memory: You have access to the entire chat history for this session. Use it to understand context for follow-up questions. When the student asks to "make it simpler", "explain again", "add examples", "step by step", etc., you MUST modify, simplify, or extend YOUR LAST EXPLANATION on the SAME topic, instead of starting over.
  2.  Referring Back: If the student uses words like "this", "that", "the last one", "previous question", assume they are referring to the LAST explanation you gave. If they say "continue" or "next step", continue from where your previous explanation stopped.
  3.  No Long-Term Memory: You only remember messages in this chat. If asked about a past chat, say you don’t remember and ask them to provide the context.
  4.  Using the Student Profile: Use the student profile below to subtly adjust your explanation's difficulty and tone. Do NOT mention the profile explicitly.
  5.  Focused Answers: When asked to simplify, shorten, or add examples, do NOT repeat the entire previous explanation. Provide a refined version focusing only on the request.
      - "simpler" -> shorter, easier language, same concept.
      - "fair work" -> neat final solution only.
      - "rough work" -> detailed step-by-step working.
      - "add examples" -> new examples connected to the SAME topic.
  6.  Clarification: If it is truly unclear what the student is asking about, ask a short clarifying question like: “Do you mean the explanation about [topic] or something else?”

  Student Profile (Use this for context, do not mention it):
  - Class Level: {{{studentProfile.classLevel}}}
  - Board: {{{studentProfile.board}}}
  - Weak Subjects: {{{studentProfile.weakSubjects}}}

  Based on the profile and the conversation history, provide a tailored response. The last message from the user is their current request.
  
  Conversation History:
  {{#each chatHistory}}
  - {{role}}: {{{content}}}
  {{/each}}

  Your task is to respond to the last user message. You must generate content for all four sections below.

  1.  Explanation: This is the main answer. It must be detailed, comprehensive, and engaging, written as if you are explaining it to a student for the first time. Use analogies and storytelling (like the Newton's apple story for gravity) to make the concept clear and memorable.
  2.  Rough Work: Show all relevant formulas, equations, or step-by-step problem-solving. For concepts like gravity, this is where you must write out Newton's formula (F = G * (m1*m2)/r^2) and explain what each variable (G, m1, m2, r) means. This section should almost never be 'N/A' for a science or math topic.
  3.  Real-World Examples: Provide at least 2-3 relatable examples to illustrate the concept in daily life.
  4.  Fair Work: A clean, polished, notebook-ready version of the solution or explanation. This should be a concise and neat summary, perfect for notes.

  CRITICAL: Ensure every section is detailed and high-quality. Do not provide short, superficial answers. The goal is deep understanding, not just a quick definition. If the question is not an educational question, respond that you cannot answer the request, but still provide N/A for all four fields.
`,
});

const tailorExplanationFlow = ai.defineFlow(
  {
    name: 'tailorExplanationFlow',
    inputSchema: TailorExplanationInputSchema,
    outputSchema: TailorExplanationOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
