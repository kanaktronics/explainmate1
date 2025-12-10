import { config } from 'dotenv';
config();

import '@/ai/flows/tailor-explanations-to-student-profile.ts';
import '@/ai/flows/generate-real-world-examples.ts';
import '@/ai/flows/generate-rough-work-derivations.ts';
import '@/ai/flows/generate-interactive-quizzes.ts';
import '@/ai/flows/teacher-companion-flow.ts';
