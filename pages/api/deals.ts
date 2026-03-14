import { NextApiRequest, NextApiResponse } from 'next';
import { getAllDeals, createDeal } from '@/queries/deals/dealsQueries';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, body } = req;

  try {
    switch (method) {
      case 'POST': {
        console.log(body);
        const newDeal = await createDeal(body);
        res.status(201).json(newDeal);
        break;
      }
      case 'GET': {
        const limit = req.query.limit ? Number(req.query.limit) : 10;
        const page = req.query.page ? Number(req.query.page) : 1;

        const deals = await getAllDeals(limit, page);

        res.status(200).json(deals);
        break;
      }
      default:
        res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
