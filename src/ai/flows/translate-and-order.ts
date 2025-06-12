'use server';

/**
 * @fileOverview An AI agent that translates user input to English, then places an order. Supports English, Russian, and Romanian.
 *
 * - translateAndOrder - A function that handles the translation and order placement process.
 * - TranslateAndOrderInput - The input type for the translateAndOrder function.
 * - TranslateAndOrderOutput - The return type for the translateAndOrder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateAndOrderInputSchema = z.object({
  language: z.enum(['en', 'ru', 'ro']).describe('The language spoken by the user.'),
  orderText: z.string().describe('The order text in the user specified language.'),
  menu: z.string().describe('The restaurant menu.'),
});
export type TranslateAndOrderInput = z.infer<typeof TranslateAndOrderInputSchema>;

const TranslateAndOrderOutputSchema = z.object({
  englishOrder: z.string().describe('The order translated to English.'),
  orderConfirmation: z.string().describe('Confirmation message for the order.'),
});
export type TranslateAndOrderOutput = z.infer<typeof TranslateAndOrderOutputSchema>;

export async function translateAndOrder(input: TranslateAndOrderInput): Promise<TranslateAndOrderOutput> {
  return translateAndOrderFlow(input);
}

const translateAndOrderPrompt = ai.definePrompt({
  name: 'translateAndOrderPrompt',
  input: {schema: TranslateAndOrderInputSchema},
  output: {schema: TranslateAndOrderOutputSchema},
  prompt: `You are an AI assistant that helps users place orders from a restaurant menu.

The user will provide their order in {{language}}, you must translate it to English.

Then, confirm the order with the user in English.

Menu: {{{menu}}}

Order in {{language}}: {{{orderText}}}

Output the translated order, and the confirmation message.`,
});

const translateAndOrderFlow = ai.defineFlow(
  {
    name: 'translateAndOrderFlow',
    inputSchema: TranslateAndOrderInputSchema,
    outputSchema: TranslateAndOrderOutputSchema,
  },
  async input => {
    const {output} = await translateAndOrderPrompt(input);
    return output!;
  }
);
