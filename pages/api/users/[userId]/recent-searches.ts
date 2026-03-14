import { NextApiRequest, NextApiResponse } from 'next';
import { getUserRecentSearches } from '@/queries/users/userQueries';
import { requireUserSession } from '@/lib/api-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = req.query.userId as string;
  const auth = await requireUserSession(req, res, userId);
  if (!auth) return;

  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const recentSearches = await getUserRecentSearches(auth.email);
        res.status(200).json({ success: true, data: recentSearches });
      } catch (error) {
        res.status(404).json({ success: false, error: String(error) });
      }
      break;

    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ success: false, error: `Method ${method} Not Allowed` });
      break;
  }
}
