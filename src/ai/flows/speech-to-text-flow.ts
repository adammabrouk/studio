
'use server';
/**
 * @fileOverview A Genkit flow for transcribing audio using Google Cloud Speech-to-Text.
 *
 * - speechToText - Transcribes audio data to text.
 * - SpeechToTextInput - Input schema for the speechToText flow.
 * - SpeechToTextOutput - Output schema for the speechToText flow.
 */

import {ai} from '@/ai/genkit';
import {SpeechClient} from '@google-cloud/speech';
import {z} from 'genkit';

const SpeechToTextInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data as a data URI. Expected format: 'data:audio/<format>;base64,<encoded_data>'. Format should be one supported by Google Cloud Speech-to-Text (e.g., audio/webm, audio/ogg, audio/wav)."
    ),
  languageCode: z.string().default('en-US').describe('The language of the audio (e.g., "en-US", "ru-RU", "ro-RO").'),
});
export type SpeechToTextInput = z.infer<typeof SpeechToTextInputSchema>;

const SpeechToTextOutputSchema = z.object({
  transcript: z.string().describe('The transcribed text from the audio.'),
});
export type SpeechToTextOutput = z.infer<typeof SpeechToTextOutputSchema>;

export async function speechToText(input: SpeechToTextInput): Promise<SpeechToTextOutput> {
  return speechToTextFlow(input);
}

const speechToTextFlow = ai.defineFlow(
  {
    name: 'speechToTextFlow',
    inputSchema: SpeechToTextInputSchema,
    outputSchema: SpeechToTextOutputSchema,
  },
  async (input) => {
    const {audioDataUri, languageCode} = input;

    if (!audioDataUri.startsWith('data:audio/')) {
        throw new Error('Invalid audioDataUri format. Must start with "data:audio/".');
    }
    
    const base64Audio = audioDataUri.split(',')[1];
    if (!base64Audio) {
        throw new Error('Invalid audioDataUri format. Could not extract base64 data.');
    }

    const audioBytes = Buffer.from(base64Audio, 'base64');

    const client = new SpeechClient();

    const audio = {
      content: audioBytes,
    };

    // Determine encoding based on mime type if possible, default to OGG_OPUS for webm
    let encoding: any = 'OGG_OPUS'; // Default, common for MediaRecorder webm
    const mimeType = audioDataUri.substring(audioDataUri.indexOf(':') + 1, audioDataUri.indexOf(';'));
    
    if (mimeType === 'audio/wav' || mimeType === 'audio/wave' || mimeType === 'audio/x-wav') {
      encoding = 'LINEAR16';
    } else if (mimeType === 'audio/ogg') { // Explicitly ogg/opus
      encoding = 'OGG_OPUS';
    } else if (mimeType === 'audio/webm') { // webm usually implies opus or vp8/vp9, opus is common for audio only
      encoding = 'WEBM_OPUS'; // More specific if available
    }
    // Add more mappings as needed or make it more robust

    const config: any = {
      encoding: encoding,
      // sampleRateHertz: 16000, // Required for LINEAR16, FLAC. Not for OGG_OPUS, WEBM_OPUS
      languageCode: languageCode,
      enableAutomaticPunctuation: true,
      // model: 'telephony', // or 'medical_dictation', 'chirp' (universal model) for better accuracy depending on use case
    };

    // For encodings like LINEAR16, sampleRateHertz is often required.
    // For OGG_OPUS or WEBM_OPUS, it's usually derived from the file.
    // The 'chirp' model is newer and might offer better quality for general use.
    // If using 'chirp', 'model' parameter is used and encoding might not be needed or different.
    // For simplicity, we'll stick to this for now.

    if (encoding === 'LINEAR16') {
        config.sampleRateHertz = 48000; // A common sample rate; adjust if known
    }


    const request = {
      audio: audio,
      config: config,
    };

    try {
      const [response] = await client.recognize(request);
      const transcription = response.results
        ?.map(result => result.alternatives?.[0].transcript)
        .join('\n');
      
      return {transcript: transcription || ''};
    } catch (error) {
      console.error('Google Cloud Speech-to-Text API error:', error);
      throw new Error(`Speech-to-Text API request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
