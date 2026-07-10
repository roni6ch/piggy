import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { reorderUserVouchers } from '@/queries/vouchers/voucherQueries'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export default async function reorderVouchersHandler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.query.userId as string
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.email || session.user.email !== userId) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT'])
    return res.status(405).json({ message: `Method ${req.method} not allowed` })
  }

  const orderedIds = req.body?.orderedIds
  if (!Array.isArray(orderedIds) || !orderedIds.every((id) => typeof id === 'string')) {
    return res.status(400).json({ message: 'orderedIds must be an array of strings' })
  }

  try {
    await reorderUserVouchers(normalizeEmail(userId), orderedIds)
    return res.status(200).json({ success: true })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: 'Failed to reorder vouchers' })
  }
}
