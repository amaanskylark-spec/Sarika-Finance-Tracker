'use server';
/**
 * @fileOverview An AI agent for suggesting transaction categories.
 *
 * - aiPoweredTransactionCategorization - A function that handles the transaction categorization process.
 * - AiPoweredTransactionCategorizationInput - The input type for the aiPoweredTransactionCategorization function.
 * - AiPoweredTransactionCategorizationOutput - The return type for the aiPoweredTransactionCategorization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiPoweredTransactionCategorizationInputSchema = z.object({
  transactionDescription: z.string().describe('The description of the transaction for categorization.'),
});
export type AiPoweredTransactionCategorizationInput = z.infer<typeof AiPoweredTransactionCategorizationInputSchema>;

const AiPoweredTransactionCategorizationOutputSchema = z.object({
  suggestedCategories: z.array(z.string()).describe('An array of suggested categories for the transaction.'),
});
export type AiPoweredTransactionCategorizationOutput = z.infer<typeof AiPoweredTransactionCategorizationOutputSchema>;

export async function aiPoweredTransactionCategorization(
  input: AiPoweredTransactionCategorizationInput
): Promise<AiPoweredTransactionCategorizationOutput> {
  return aiPoweredTransactionCategorizationFlow(input);
}

const aiPoweredTransactionCategorizationPrompt = ai.definePrompt({
  name: 'aiPoweredTransactionCategorizationPrompt',
  input: {schema: AiPoweredTransactionCategorizationInputSchema},
  output: {schema: AiPoweredTransactionCategorizationOutputSchema},
  prompt: `You are a helpful financial assistant. Your task is to analyze a transaction description and suggest up to 3 highly relevant categories for it.

Respond with a JSON object containing a single key "suggestedCategories" which is an array of strings. Each string in the array should be a category. Do not include any other text or explanation.

Transaction Description: {{{transactionDescription}}}`,
});

const aiPoweredTransactionCategorizationFlow = ai.defineFlow(
  {
    name: 'aiPoweredTransactionCategorizationFlow',
    inputSchema: AiPoweredTransactionCategorizationInputSchema,
    outputSchema: AiPoweredTransactionCategorizationOutputSchema,
  },
  async input => {
    const {output} = await aiPoweredTransactionCategorizationPrompt(input);
    return output!;
  }
);
