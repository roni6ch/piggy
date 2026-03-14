import { NextApiRequest, NextApiResponse } from 'next';
import {
  createBusiness,
  deleteBusiness,
  getBusiness,
  getBusinesses,
  updateBusiness,
} from '@/queries/businesses/businessQueries';

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
          const business = await getBusiness(req.query.id as string);
          if (!business) {
            res.status(404).json({ message: 'Business Not Found' });
          } else {
            res.status(200).json(business);
          }
        } catch (error) {
          res.status(500).json({ message: 'Internal Server Error' });
        }
      } else {
        try {
          const businesses = await getBusinesses(limit, page);
          res.status(200).json(businesses);
        } catch (error) {
          res.status(500).json({ message: 'Internal Server Error' });
        }
      }
      break;
    }
    case 'POST': {
      const { name, imageSrc, imageSrcBig } = req.body;
      if (!name || !imageSrc || imageSrcBig) {
        res
          .status(400)
          .json({ message: 'Name, ImageSrc and imageSrcBig are required' });
        return;
      }

      const business: any = {
        name,
        imageSrc,
        imageSrcBig,
      };

      try {
        const result = await createBusiness(business);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
      }
      break;
    }
    case 'PUT': {
      const { id, name, imageSrc, imageSrcBig } = req.body;
      if (!id || !name || !imageSrc || imageSrcBig) {
        res
          .status(400)
          .json({ message: 'ID, Name, imageSrc and imageSrcBig are required' });
        return;
      }

      const business: any = {
        _id: id,
        name,
        imageSrc,
        imageSrcBig,
      };

      try {
        const result = await updateBusiness(business);
        if (!result) {
          res.status(404).json({ message: 'Business Not Found' });
        } else {
          res.status(200).json(result);
        }
      } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
      }
      break;
    }
    case 'DELETE': {
      const { id } = req.body;
      if (!id) {
        res.status(400).json({ message: 'ID is required' });
        return;
      }

      try {
        const result = await deleteBusiness(id);
        if (!result) {
          res.status(404).json({ message: 'Business Not Found' });
        } else {
          res.status(200).json({ message: 'Business deleted successfully' });
        }
      } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
      }
      break;
    }
    default: {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  }
}
