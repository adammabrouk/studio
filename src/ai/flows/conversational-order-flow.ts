
'use server';
/**
 * @fileOverview A conversational AI agent for taking restaurant orders.
 *
 * - conversationalOrder - A function that handles the conversation.
 * - ConversationalOrderInput - The input type for the conversationalOrder function.
 * - ConversationalOrderOutput - The return type for the conversationalOrder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeminiMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(z.object({ text: z.string() })),
});

const ConversationalOrderInputSchema = z.object({
  message: z.string().describe('The latest message from the user.'),
  menu: z.string().describe('The restaurant menu.'),
  language: z.enum(['en', 'ru', 'ro']).describe('The language for the conversation.'),
  history: z.array(GeminiMessageSchema).optional().describe('The conversation history in Gemini format.'),
});
export type ConversationalOrderInput = z.infer<typeof ConversationalOrderInputSchema>;

const ConversationalOrderOutputSchema = z.object({
  response: z.string().describe('The AI assistant_s response.'),
});
export type ConversationalOrderOutput = z.infer<typeof ConversationalOrderOutputSchema>;

export async function conversationalOrder(input: ConversationalOrderInput): Promise<ConversationalOrderOutput> {
  return conversationalOrderFlow(input);
}

const conversationalOrderFlow = ai.defineFlow(
  {
    name: 'conversationalOrderFlow',
    inputSchema: ConversationalOrderInputSchema,
    outputSchema: ConversationalOrderOutputSchema,
  },
  async (input) => {
    const { message, menu, language, history } = input;

    // System context to guide the AI.
    // This will be part of the prompt sent to the AI model.
    const systemContext = `You are a friendly and highly efficient AI assistant for "OrderFlow" restaurant.
Your primary goal is to help users explore the menu and place food orders accurately.
Converse with the user in ${language}.
The restaurant menu is provided below. Refer to it for item availability and details.
--- Menu Start ---
${menu}
--- Menu End ---

Key Instructions:
- If an item is not on the menu, politely inform the user and, if appropriate, suggest alternatives from the menu.
- Ask clarifying questions if the user's request is ambiguous (e.g., "Which size?", "Any specific toppings?").
- Be concise but maintain a helpful and polite tone.
- You can confirm items and summarize the order before the user finalizes it.
- Do not make up items or prices. Stick to the provided menu.
- If the user asks for your capabilities, explain you can help them browse the menu, answer questions about items, and take their order.
`;

    // Construct the prompt for the ai.generate call.
    // The user's current message is the main part of this turn's prompt.
    // The systemContext provides overall guidance.
    // The history provides conversational context.
    const currentPromptForGenerate = `${systemContext}\nThe user's current message is: "${message}". Please respond.`;
    
    const { output } = await ai.generate({
      prompt: currentPromptForGenerate,
      history: history || [], // Pass the conversation history.
      // The model will be the default one configured in @/ai/genkit.ts (gemini-2.0-flash)
      // config: { // Optional: Add safetySettings or other model-specific configs if needed
      //   temperature: 0.7, 
      // },
    });

    if (!output || typeof output.text !== 'string') {
      console.error('AI response was empty or not text:', output);
      throw new Error('AI did not return a valid text response.');
    }

    return { response: output.text };
  }
);
