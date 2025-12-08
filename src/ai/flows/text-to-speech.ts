
'use server';
/**
 * @fileOverview A flow for converting text to high-quality speech with translation.
 *
 * - textToSpeech - A function that handles text-to-speech conversion and translation.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import wav from 'wav';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
  language: z
    .enum(['English', 'Hindi', 'Hinglish'])
    .describe(
      'The target language for the speech. If not English, the text will be translated first.'
    ),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audio: z
    .string()
    .describe(
      "The generated audio as a Base64-encoded data URI in WAV format. Format: 'data:audio/wav;base64,<encoded_data>'"
    ),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(
  input: TextToSpeechInput
): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

const translationPrompt = ai.definePrompt({
  name: 'translationPrompt',
  input: {
    schema: z.object({
      text: z.string(),
      language: z.string(),
    }),
  },
  output: {
    schema: z.object({translatedText: z.string()}),
  },
  prompt: `Translate the following text into {{language}}.

If the language is 'Hinglish', you must use a natural mix of Hindi and English words in a conversational way, as a teacher in India would explain a concept to a student. Use the Devanagari script for Hindi words where appropriate.

Text to translate:
"{{text}}"`,
});

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async input => {
    let textToSpeak = input.text;

    if (input.language !== 'English') {
      const {output} = await translationPrompt({
        text: input.text,
        language: input.language,
      });
      if (output) {
        textToSpeak = output.translatedText;
      }
    }

    const {media} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: input.language === 'English' ? 'Alloy' : 'Algenib',
            },
          },
        },
      },
      prompt: textToSpeak,
    });

    if (!media) {
      throw new Error('No audio media was generated.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavBase64 = await toWav(audioBuffer);

    return {
      audio: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
