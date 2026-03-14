import { NextApiRequest, NextApiResponse } from 'next';
import { getUserCards, addUserCardByChoice } from '@/queries/users/userQueries';
import { requireUserSession } from '@/lib/api-auth';
import { addCardBodySchema } from '@/lib/api-schemas';

export default async function cardHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = req.query.userId as string;
  const auth = await requireUserSession(req, res, userId);
  if (!auth) return;

  const { method, body } = req;

  try {
    switch (method) {
      case 'GET': {
        const userWithCards = await getUserCards(auth.email);
        if (userWithCards) {
          // Return only cards to avoid leaking PII (email, name, etc.)
          res.status(200).json({ cards: userWithCards.cards ?? [] });
        } else {
          res.status(404).json({ message: 'User not found' });
        }
        break;
      }
      case 'POST': {
        const parsed = addCardBodySchema.safeParse(body ?? {});
        if (!parsed.success) {
          const msg = parsed.error.flatten().formErrors[0] ?? 'Invalid body';
          res.status(400).json({ message: typeof msg === 'string' ? msg : 'club and provider are required' });
          break;
        }
        const { club, provider } = parsed.data;
        const newCard = await addUserCardByChoice(auth.email, { club, provider });
        if (newCard) {
          res.status(201).json(newCard);
        } else {
          res.status(400).json({ message: 'Could not add card' });
        }
        break;
      }
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ message: `Method ${method} not allowed` });
        break;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}
