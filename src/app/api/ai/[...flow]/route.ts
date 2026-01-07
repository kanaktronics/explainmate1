
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Initialize Genkit and plugins
genkit({
  plugins: [googleAI()],
});

export { GET, POST } from '@genkit-ai/next';
