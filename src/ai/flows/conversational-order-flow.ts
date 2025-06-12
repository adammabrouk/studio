
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
- **Upselling:** Proactively look for opportunities to suggest complementary items from the menu to enhance the user's meal. For example, if they order a main course, you could suggest a popular appetizer, drink, or dessert. If they order just an appetizer, perhaps suggest a main course that pairs well.
- When upselling, be natural and helpful, not pushy. Phrase suggestions like 'Would you like to add a drink with that?' or 'Our Bruschetta is a popular starter, would you like to try it?' Base your suggestions on the current order and the menu provided.
`;

    const currentPromptForGenerate = `${systemContext}\nThe user's current message is: "${message}". Please respond.`;
    
    const { output } = await ai.generate({
      prompt: currentPromptForGenerate,
      history: history || [], 
    });

    if (!output || typeof output.text !== 'string') {
      console.error('AI response was empty or not text:', output);
      throw new Error('AI did not return a valid text response.');
    }

    return { response: output.text };
  }
);

