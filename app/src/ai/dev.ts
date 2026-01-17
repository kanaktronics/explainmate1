
import { config } from 'dotenv';
config();

import '@/ai/flows/tailor-explanations-to-student-profile.ts';
import '@/ai/flows/generate-real-world-examples.ts';
import '@/ai/flows/generate-rough-work-derivations.ts';
import '@/ai/flows/generate-interactive-quizzes.ts';
import '@/ai/flows/teacher-companion-flow.ts';
import '@/ai/flows/run-progress-engine.ts';
import '@/ai/flows/generate-exam-plan.ts';
import '@/ai/flows/generate-subject-topics.ts';
import '@/ai/flows/grade-short-answer.ts';
import '@/ai/flows/text-to-speech-flow.ts';
import '@/ai/flows/generate-flashcards.ts';
