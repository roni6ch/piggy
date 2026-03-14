import { NextApiRequest, NextApiResponse } from 'next';
import {
  createCard,
  deleteCard,
  getAllCards,
  getCardById,
  getCards,
  updateCard,
} from '@/queries/cards/cardQueries';
import { cardsQuerySchema } from '@/lib/api-schemas';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case 'GET': {
      const parsed = cardsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        const first = parsed.error.flatten().formErrors[0];
        return res.status(400).json({ message: typeof first === 'string' ? first : 'Invalid query' });
      }
      const { id, limit, page, all } = parsed.data;

      if (id) {
        try {
          const card = await getCardById(id);
          if (!card) {
            res.status(404).json({ message: 'Card Not Found' });
          } else {
            res.status(200).json(card);
          }
        } catch (error) {
          res.status(500).json({ message: 'Internal Server Error' });
        }
      } else {
        try {
          const fetchAll = all === 'true' || all === '1';
          if (fetchAll) {
            const data = await getAllCards();
            res.status(200).json({ data, total: data.length, totalPages: 1 });
          } else {
            const cards = await getCards(limit, page);
            res.status(200).json(cards);
          }
        } catch (error) {
          res.status(500).json({ message: 'Internal Server Error' });
        }
      }
      break;
    }
    default: {
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  }
}
