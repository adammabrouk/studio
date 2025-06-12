
import { config } from 'dotenv';
config();

import '@/ai/flows/translate-and-order.ts';
import '@/ai/flows/suggest-menu-item.ts';
import '@/ai/flows/conversational-order-flow.ts';
import '@/ai/flows/speech-to-text-flow.ts'; // Added new STT flow
import '@/ai/flows/text-to-speech-flow.ts'; // Added new TTS flow
