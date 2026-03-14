import { NextApiRequest, NextApiResponse } from 'next';
import { getDealsByBusinessId } from '@/queries/deals/dealsQueries';

/** Minimal card shape for mock deals (Card component expects _id, name, issuer, imageSrc, provider, club, bg). */
const MOCK_CARD = {
  _id: 'mock-card-1',
  name: 'Sample Card',
  issuer: 'regular',
  imageSrc: '',
  provider: 'VISA',
  club: 'max',
  bg: '#182957',
};

function getMockDeals(businessId: string) {
  const nextYear = new Date().getFullYear() + 1;
  return {
    data: [
      {
        _id: 'mock-deal-1',
        description: '10% off your purchase',
        expirationDate: new Date(nextYear, 5, 1).toISOString(),
        createDate: new Date().toISOString(),
        link: '#',
        cardId: MOCK_CARD,
        businessId,
      },
      {
        _id: 'mock-deal-2',
        description: 'Free shipping on orders over ₪100',
        expirationDate: new Date(nextYear, 11, 31).toISOString(),
        createDate: new Date().toISOString(),
        link: '#',
        cardId: { ...MOCK_CARD, _id: 'mock-card-2', club: 'discount' },
        businessId,
      },
      {
        _id: 'mock-deal-3',
        description: 'Buy one get one 50% off',
        expirationDate: new Date(nextYear, 2, 15).toISOString(),
        createDate: new Date().toISOString(),
        link: '#',
        cardId: { ...MOCK_CARD, _id: 'mock-card-3', club: 'leumi' },
        businessId,
      },
    ],
    total: 3,
    totalPages: 1,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET': {
        const limit = req.query.limit ? Number(req.query.limit) : 10;
        const page = req.query.page ? Number(req.query.page) : 1;
        const businessId = req.query.businessId as string;

        if (!businessId) {
          return res.status(400).json({ message: 'Invalid request' });
        }

        try {
          const deals = await getDealsByBusinessId(businessId, limit, page);
          const hasData = deals?.data?.length > 0;
          if (hasData) {
            return res.status(200).json(deals);
          }
        } catch {
          // Fall through to mocks
        }

        const mocks = getMockDeals(businessId);
        return res.status(200).json(mocks);
      }
      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error handling request:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
