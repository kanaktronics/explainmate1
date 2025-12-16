
'use server';
/**
 * @fileOverview Generates a list of topics and sub-topics for a given subject, class, and board.
 *
 * - getTopicsForSubject - The main function to call the topic generation flow.
 * - GenerateSubjectTopicsInput - The input type for the flow.
 * - GenerateSubjectTopicsOutput - The output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateSubjectTopicsInputSchema = z.object({
  subject: z.string().describe('The main subject (e.g., Science, Maths).'),
  classLevel: z.string().describe('The class or grade level of the student.'),
  board: z.string().describe('The educational board (e.g., CBSE, ICSE).'),
});
export type GenerateSubjectTopicsInput = z.infer<typeof GenerateSubjectTopicsInputSchema>;

const TopicGroupSchema = z.object({
    groupName: z.string().describe('The name of the topic group. For subjects like Science, this would be "Physics", "Chemistry", "Biology". For subjects like Maths, it would just be "Topics".'),
    topics: z.array(z.string()).describe('A list of chapter or topic names within this group.'),
});

const GenerateSubjectTopicsOutputSchema = z.object({
  topicGroups: z.array(TopicGroupSchema).describe('An array of topic groups for the given subject.'),
});
export type GenerateSubjectTopicsOutput = z.infer<typeof GenerateSubjectTopicsOutputSchema>;


export async function getTopicsForSubject(input: GenerateSubjectTopicsInput): Promise<GenerateSubjectTopicsOutput> {
  return getTopicsForSubjectFlow(input);
}


const topicsPrompt = ai.definePrompt({
  name: 'generateSubjectTopicsPrompt',
  input: { schema: GenerateSubjectTopicsInputSchema },
  output: { schema: GenerateSubjectTopicsOutputSchema },
  prompt: `You are an expert on Indian educational syllabi. Your task is to generate a list of all topics/chapters for a given subject, class, and board.

  Student Profile:
  - Class: {{classLevel}}
  - Board: {{board}}
  - Subject: {{subject}}

  Instructions:
  1.  Generate a comprehensive list of all topics or chapters for the specified subject based on the official syllabus for the given class and board.
  2.  For broad subjects like 'Science', you MUST group the topics into their respective sub-disciplines (e.g., "Physics", "Chemistry", "Biology"). The groupName should be the sub-discipline.
  3.  For subjects that are not composed of sub-disciplines (e.g., 'Maths', 'English'), use a single group with the groupName "Topics".
  4.  Ensure the topic names are accurate and match what a student would find in their textbook. Do not abbreviate.
  
  Example for Science, Class 10, CBSE:
  {
      "topicGroups": [
          {
              "groupName": "Chemistry",
              "topics": ["Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals", "Carbon and its Compounds", "Periodic Classification of Elements"]
          },
          {
              "groupName": "Biology",
              "topics": ["Life Processes", "Control and Coordination", "How do Organisms Reproduce?", "Heredity and Evolution", "Our Environment"]
          },
          {
              "groupName": "Physics",
              "topics": ["Light – Reflection and Refraction", "Human Eye and Colourful World", "Electricity", "Magnetic Effects of Electric Current", "Sources of Energy"]
          }
      ]
  }

  Example for Maths, Class 9, CBSE:
  {
      "topicGroups": [
          {
              "groupName": "Topics",
              "topics": ["Number Systems", "Polynomials", "Coordinate Geometry", "Linear Equations in Two Variables", "Introduction to Euclid's Geometry", "Lines and Angles", "Triangles", "Quadrilaterals", "Circles", "Heron's Formula", "Surface Areas and Volumes", "Statistics", "Probability"]
          }
      ]
  }
  
  Generate the output as a single JSON object matching the defined output schema.`,
});

const getTopicsForSubjectFlow = ai.defineFlow(
  {
    name: 'getTopicsForSubjectFlow',
    inputSchema: GenerateSubjectTopicsInputSchema,
    outputSchema: GenerateSubjectTopicsOutputSchema,
  },
  async (input) => {
    const { output } = await topicsPrompt(input);
    return output!;
  }
);
