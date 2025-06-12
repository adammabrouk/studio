
import { config } from 'dotenv';
config();

import '@/ai/flows/translate-and-order.ts';
import '@/ai/flows/suggest-menu-item.ts';
import '@/ai/flows/conversational-order-flow.ts'; // Added new conversational flow
