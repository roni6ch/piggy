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
        body.name != null || body.imageSrc != null || body.imageSrcBig != null
          ? {
              name: body.name != null ? String(body.name) : undefined,
              imageSrc: body.imageSrc != null ? String(body.imageSrc) : undefined,
              imageSrcBig: body.imageSrcBig != null ? String(body.imageSrcBig) : undefined,
              address: body.address != null ? String(body.address) : undefined,
              rating: body.rating != null ? Number(body.rating) : undefined,
              userRatingsTotal: body.userRatingsTotal != null ? Number(body.userRatingsTotal) : undefined,
              openingHours: body.openingHours != null ? String(body.openingHours) : undefined,
              openingHoursWeekdays: Array.isArray(body.openingHoursWeekdays) ? body.openingHoursWeekdays.map(String) : undefined,
              phone: body.phone != null ? String(body.phone) : undefined,
              website: body.website != null ? String(body.website) : undefined,
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