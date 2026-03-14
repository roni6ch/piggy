import type { NextApiRequest, NextApiResponse } from 'next';

/** Example placeholders; can be replaced with LLM-generated suggestions (e.g. OpenAI). */
const PLACEHOLDERS = [
  'best deals at KSP',
  'coffee near me',
  'restaurants with discounts',
  'cinema deals this week',
  'stores that accept my card',
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ placeholder: string } | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const placeholder =
    PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];
  return res.status(200).json({ placeholder });
}
