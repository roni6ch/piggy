import { NextApiRequest, NextApiResponse } from 'next';
import { addRecentSearch } from '@/queries/users/userQueries';
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
    case 'POST': {
      const businessId = req.query.business as string;
      if (!businessId) {
        res.status(400).json({ success: false, error: 'business is required' });
        return;
      }
      const body = typeof req.body === 'object' && req.body != null ? req.body : {};
      const display =
        body.name != null
          ? {
              name: String(body.name),
              imageSrc: body.imageSrc != null ? String(body.imageSrc) : undefined,
              imageSrcBig: body.imageSrcBig != null ? String(body.imageSrcBig) : undefined,
            }
          : undefined;

      try {
        await addRecentSearch(auth.email, businessId, display);
        res.status(201).json({ success: true });
      } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, error: String(error) });
      }
      break;
    }

    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).json({ success: false, error: `Method ${method} Not Allowed` });
      break;
  }
}
