import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import type { AiSearchResponse } from '@/common/types';
import {
  toolSearchStores,
  toolGetDealsByBusiness,
  toolGetUserCards,
  buildBestCombos,
} from '@/lib/ai-search-tools';
import {
  generateSearchSummary,
  applyLLMToResponse,
} from '@/lib/ai-search-llm';
import { aiSearchBodySchema } from '@/lib/api-schemas';

const MAX_STORES_FOR_DEALS = 10;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AiSearchResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  const userEmail = session?.user?.email;
  const parsed = aiSearchBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const first = parsed.error.flatten().formErrors[0];
    return res.status(400).json({ error: typeof first === 'string' ? first : 'Missing or invalid "query" in body' });
  }
  const query = parsed.data.query;

  try {
    // 1) Search stores by name
    const stores = await toolSearchStores(query, 20);
    if (stores.length === 0) {
      const response: AiSearchResponse = {
        query,
        stores: [],
        dealsByStore: {},
        userCards: userEmail ? await toolGetUserCards(userEmail) : [],
        bestCombos: {
          summary: 'No stores match your search. Try a different name or category.',
          items: [],
        },
      };
      return res.status(200).json(response);
    }

    // 2) Get user cards (for best-combo matching)
    const userCards = userEmail ? await toolGetUserCards(userEmail) : [];

    // 3) Get deals for each store (limit to avoid N+1 explosion)
    const storesToFetch = stores.slice(0, MAX_STORES_FOR_DEALS);
    const dealsByStore: Record<string, Awaited<ReturnType<typeof toolGetDealsByBusiness>>> = {};
    await Promise.all(
      storesToFetch.map(async (store) => {
        const deals = await toolGetDealsByBusiness(store._id);
        dealsByStore[store._id] = deals;
      })
    );

    // 4) Build best combos (deals that match user's cards)
    const bestCombos = buildBestCombos(stores, dealsByStore, userCards);

    let response: AiSearchResponse = {
      query,
      stores,
      dealsByStore,
      userCards,
      bestCombos,
      message:
        bestCombos.items.length > 0
          ? `Found ${stores.length} store(s). ${bestCombos.items.length} deal(s) match your cards.`
          : `Found ${stores.length} store(s). Add cards in Settings to see personalized deals.`,
    };

    // 5) Optional: Gemini agent summary (uses GEMINI_API_KEY or GIMINI_API_KEY)
    const llmSummary = await generateSearchSummary({
      query,
      storesCount: stores.length,
      bestCombosCount: bestCombos.items.length,
      userCardsCount: userCards.length,
      storeNames: stores.slice(0, 5).map((s) => s.name),
    });
    response = applyLLMToResponse(response, llmSummary);

    return res.status(200).json(response);
  } catch (err) {
    console.error('ai-search error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal Server Error',
    });
  }
}
