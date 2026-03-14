import { NextApiRequest, NextApiResponse } from 'next';
import {
  addCardToUser,
  deleteUserCardById,
} from '@/queries/users/userQueries';
import { requireUserSession } from '@/lib/api-auth';

export default async function cardHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = req.query.userId as string;
  const auth = await requireUserSession(req, res, userId);
  if (!auth) return;

  const cardId = req.query.cardId as string;
  const { method } = req;

  try {
    switch (method) {
      case 'PUT':
        if (!cardId) {
          res.status(400).json({ message: 'Card ID is required' });
        } else {
          const addedCard = await addCardToUser(auth.email, cardId);
          if (addedCard) {
            res.status(200).json(addedCard);
          } else {
            res.status(404).json({ message: 'Card could not be added or not found' });
          }
        }
        break;
      case 'DELETE':
        if (!cardId) {
          res.status(400).json({ message: 'Card ID is required' });
        } else {
          const deleted = await deleteUserCardById(auth.email, cardId);
          if (deleted) {
            res.status(200).json({ message: 'Card removed' });
          } else {
            res.status(404).json({ message: 'Card not found' });
          }
        }
        break;
      default:
        res.setHeader('Allow', ['PUT', 'DELETE']);
        res.status(405).json({ message: `Method ${method} not allowed` });
        break;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}
