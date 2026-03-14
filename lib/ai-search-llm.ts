/**
 * Agent / LLM setup for AI search using Google Gemini.
 *
 * Uses GEMINI_API_KEY or GIMINI_API_KEY (typo-tolerant) from env.
 * One non-streaming call to generate a short natural-language summary.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AiSearchResponse } from '@/common/types';

const MODEL = 'gemini-1.5-flash';

function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY ?? process.env.GIMINI_API_KEY;
}

export type LLMContext = {
  query: string;
  storesCount: number;
  bestCombosCount: number;
  userCardsCount: number;
  storeNames?: string[];
};

/**
 * Generate a short natural-language summary using Gemini.
 * Returns null if no API key or on error (fallback to default summary).
 */
export async function generateSearchSummary(
  context: LLMContext
): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey?.trim()) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL });

    const storeList =
      (context.storeNames?.length ?? 0) > 0
        ? ` Stores: ${(context.storeNames ?? []).slice(0, 5).join(', ')}.`
        : '';

    const prompt = `You are a friendly shopping assistant. In one short sentence (max 15 words), summarize this search result for the user. Be concise and actionable.

User searched: "${context.query}"
Found ${context.storesCount} store(s), ${context.bestCombosCount} deal(s) that match the user's cards. User has ${context.userCardsCount} card(s).${storeList}

Reply with only the summary sentence, no quotes or preamble.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text()?.trim();
    return text && text.length > 0 ? text : null;
  } catch (err) {
    console.error('Gemini generateSearchSummary error:', err);
    return null;
  }
}

/**
 * Merge LLM summary into the API response (override message).
 */
export function applyLLMToResponse(
  response: AiSearchResponse,
  llmSummary: string | null
): AiSearchResponse {
  if (!llmSummary) return response;
  return {
    ...response,
    message: llmSummary,
  };
}
