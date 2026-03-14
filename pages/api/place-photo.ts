import type { NextApiRequest, NextApiResponse } from 'next';

const PLACES_PHOTO_MEDIA = 'https://places.googleapis.com/v1';
const MAX_WIDTH = 800;
const MAX_HEIGHT = 600;

/**
 * Proxies Google Place Photos (New) so the API key stays server-side.
 * GET /api/place-photo?name=places%2FChIJ...%2Fphotos%2F...
 * Redirects to the actual image URL.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
  if (!name || !name.startsWith('places/')) {
    return res.status(400).json({ error: 'Missing or invalid "name" query (e.g. places/PLACE_ID/photos/PHOTO_ID)' });
  }

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Google Places API key not configured' });
  }

  const url = `${PLACES_PHOTO_MEDIA}/${name}/media?maxWidthPx=${MAX_WIDTH}&maxHeightPx=${MAX_HEIGHT}&key=${encodeURIComponent(key)}`;

  try {
    const response = await fetch(url, { redirect: 'manual' });
    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get('location');
      if (location) {
        res.redirect(302, location);
        return;
      }
    }
    if (!response.ok) {
      const text = await response.text();
      console.error('Place photo error:', response.status, text);
      return res.status(response.status === 404 ? 404 : 502).end();
    }
    res.status(502).end();
  } catch (err) {
    console.error('place-photo error:', err);
    res.status(500).end();
  }
}
