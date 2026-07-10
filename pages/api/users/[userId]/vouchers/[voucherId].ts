import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { uploadVoucherSchema } from '@/common/schemas/upload-voucher-schema'
import { uploadVoucherImage } from '@/lib/upload-voucher-image'
import { deleteUserVoucher, updateUserVoucher } from '@/queries/vouchers/voucherQueries'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export default async function voucherByIdHandler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.query.userId as string
  const voucherId = req.query.voucherId as string
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.email || session.user.email !== userId) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  const email = normalizeEmail(userId)

  if (req.method === 'PATCH') {
    const parsed = uploadVoucherSchema.safeParse(req.body?.values ?? req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid voucher data' })
    }

    let imageUrl: string | undefined
    let imageData: string | undefined
    let clearImage = false
    const receiptImage = req.body?.receiptImage

    if (receiptImage === null) {
      clearImage = true
    } else if (receiptImage && typeof receiptImage === 'string') {
      const uploaded = await uploadVoucherImage({ email, receiptImage })
      imageUrl = uploaded.imageUrl
      imageData = uploaded.imageData
    }

    try {
      const updated = await updateUserVoucher(email, voucherId, parsed.data, {
        imageUrl,
        imageData,
        clearImage,
      })
      if (!updated) return res.status(404).json({ message: 'Voucher not found' })
      return res.status(200).json({
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      })
    } catch (e) {
      console.error(e)
      return res.status(500).json({ message: 'Failed to update voucher' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const deleted = await deleteUserVoucher(email, voucherId)
      if (!deleted) return res.status(404).json({ message: 'Voucher not found' })
      return res.status(200).json({ success: true })
    } catch (e) {
      console.error(e)
      return res.status(500).json({ message: 'Failed to delete voucher' })
    }
  }

  res.setHeader('Allow', ['DELETE', 'PATCH'])
  return res.status(405).json({ message: `Method ${req.method} not allowed` })
}
