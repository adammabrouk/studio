// src/ai/flows/suggest-menu-item.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow that suggests menu items based on user dietary restrictions and preferences.
 *
 * - suggestMenuItem - A function that takes user preferences and suggests a menu item.
 * - SuggestMenuItemInput - The input type for the suggestMenuItem function.
 * - SuggestMenuItemOutput - The return type for the suggestMenuItem function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMenuItemInputSchema = z.object({
  preferences: z
    .string()
    .describe(
      'The dietary restrictions or preferences of the user. Examples: vegetarian, gluten-free, no spicy food.'
    ),
  menu: z.string().describe('The menu of the restaurant in plain text.'),
});

export type SuggestMenuItemInput = z.infer<typeof SuggestMenuItemInputSchema>;

const SuggestMenuItemOutputSchema = z.object({
  suggestion: z.string().describe('A suggested menu item based on the user preferences.'),
  reason: z.string().describe('The reason why the menu item was suggested.'),
});

export type SuggestMenuItemOutput = z.infer<typeof SuggestMenuItemOutputSchema>;

export async function suggestMenuItem(input: SuggestMenuItemInput): Promise<SuggestMenuItemOutput> {
  return suggestMenuItemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMenuItemPrompt',
  input: {schema: SuggestMenuItemInputSchema},
  output: {schema: SuggestMenuItemOutputSchema},
  prompt: `You are a helpful restaurant assistant. A user has the following dietary restrictions or preferences: {{{preferences}}}. The restaurant menu is as follows: {{{menu}}}. Suggest one menu item that the user might enjoy, and explain why you are suggesting it. Return the menu item in the 'suggestion' field and the reason in the 'reason' field.

  Do not suggest items that are not on the menu. Only suggest one item. Be concise.`,
});

const suggestMenuItemFlow = ai.defineFlow(
  {
    name: 'suggestMenuItemFlow',
    inputSchema: SuggestMenuItemInputSchema,
    outputSchema: SuggestMenuItemOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
