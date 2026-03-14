import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getCategories,
  getCategoryById,
} from '@/queries/categories/categoryQueries';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case 'GET': {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const page = req.query.page ? Number(req.query.page) : 1;

      if (req.query.id) {
        try {
          const category = await getCategoryById(req.query.id as string);
          if (!category) {
            res.status(404).json({ message: 'Category Not Found' });
          } else {
            res.status(200).json(category);
          }
        } catch (error) {
          res.status(500).json({ message: 'Internal Server Error' });
        }
      } else {
        try {
          const categories = await getCategories(limit, page);
          res.status(200).json(categories);
        } catch (error) {
          res.status(500).json({ message: 'Internal Server Error' });
        }
      }
      break;
    }
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
}
