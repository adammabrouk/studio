
'use server';
/**
 * @fileOverview A Genkit flow for synthesizing speech using Google Cloud Text-to-Speech.
 *
 * - textToSpeech - Synthesizes text into speech audio data.
 * - TextToSpeechInput - Input schema for the textToSpeech flow.
 * - TextToSpeechOutput - Output schema for the textToSpeech flow.
 */

import {ai} from '@/ai/genkit';
import {TextToSpeechClient} from '@google-cloud/text-to-speech';
import {z} from 'genkit';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to synthesize.'),
  languageCode: z.string().default('en-US').describe('The language of the text (e.g., "en-US", "ru-RU", "ro-RO").'),
  voiceName: z.string().optional().describe('Optional specific voice name (e.g., "en-US-Wavenet-D"). If not provided, a default will be selected.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z
    .string()
    .describe("Synthesized audio data as a data URI. Format: 'data:audio/mpeg;base64,<encoded_data>'."),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async (input) => {
    const {text, languageCode, voiceName} = input;

    const client = new TextToSpeechClient();

    const ttsRequest = {
      input: {text: text},
      voice: {
        languageCode: languageCode,
        name: voiceName || getDefaultVoiceForLanguage(languageCode), // Select a default Wavenet voice if none provided
        ssmlGender: (voiceName && voiceName.includes('Wavenet-A') || voiceName && voiceName.includes('Wavenet-C') || voiceName && voiceName.includes('Wavenet-E') || voiceName && voiceName.includes('Wavenet-G') || voiceName && voiceName.includes('Wavenet-I')) ? 'MALE' : 'FEMALE', // Heuristic for Wavenet
      },
      audioConfig: {
        audioEncoding: 'MP3' as const, // Explicitly type as 'MP3'
        // speakingRate: 1.0, // Optional: Adjust speaking rate
        // pitch: 0, // Optional: Adjust pitch
      },
    };

    try {
      const [response] = await client.synthesizeSpeech(ttsRequest);
      if (!response.audioContent) {
        throw new Error('Text-to-Speech API did not return audio content.');
      }
      const audioBytes = response.audioContent instanceof Uint8Array 
        ? Buffer.from(response.audioContent) 
        : response.audioContent;

      const audioBase64 = (typeof audioBytes === 'string' ? Buffer.from(audioBytes, 'binary') : Buffer.from(audioBytes)).toString('base64');
      const audioDataUri = `data:audio/mpeg;base64,${audioBase64}`;
      
      return {audioDataUri};
    } catch (error) {
      console.error('Google Cloud Text-to-Speech API error:', error);
      throw new Error(`Text-to-Speech API request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);


// Helper to select a default high-quality voice if none is specified
function getDefaultVoiceForLanguage(languageCode: string): string {
    // These are examples, refer to Google Cloud TTS documentation for available voices
    // Prefer Wavenet voices for quality
    const voices: {[key: string]: string} = {
        'en-US': 'en-US-Standard-C', // Changed from Wavenet-D for broader availability
        'ru-RU': 'ru-RU-Standard-A', // Wavenet might not be available for all standard voices
        'ro-RO': 'ro-RO-Wavenet-A',
        // Add more mappings as needed
    };
    return voices[languageCode] || (languageCode.startsWith('en') ? 'en-US-Standard-C' : `${languageCode}-Standard-A`);
}
