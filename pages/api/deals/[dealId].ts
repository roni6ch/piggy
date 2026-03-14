import { NextApiRequest, NextApiResponse } from 'next';
import {
  getDealById,
  updateDealById,
  deleteDealById,
} from '@/queries/deals/dealsQueries';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query, body } = req;
  const { dealId } = query;

  try {
    switch (method) {
      case 'GET':
        if (dealId) {
          const deal = await getDealById(dealId as string);
          res.status(200).json(deal);
        } else {
          res.status(400).json({ message: 'Invalid request' });
        }
        break;
      case 'PUT':
        if (dealId) {
          const updatedDeal = await updateDealById(dealId as string, body);
          res.status(200).json(updatedDeal);
        } else {
          res.status(400).json({ message: 'Invalid request' });
        }
        break;
      case 'DELETE':
        if (dealId) {
          await deleteDealById(dealId as string);
          res.status(204).end();
        } else {
          res.status(400).json({ message: 'Invalid request' });
        }
        break;
      default:
        res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
