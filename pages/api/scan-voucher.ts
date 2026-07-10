import type { NextApiRequest, NextApiResponse } from 'next'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ScanVoucherResult, VoucherType } from '@/common/schemas/upload-voucher-schema'

const MODEL = 'gemini-1.5-flash'

function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY ?? process.env.GIMINI_API_KEY
}

function parseScanResult(text: string): ScanVoucherResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return {}
  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
    const voucherType = ['coupon', 'voucher', 'credit', 'gift_card'].includes(String(parsed.voucherType))
      ? (parsed.voucherType as VoucherType)
      : undefined
    return {
      voucherType,
      title: typeof parsed.title === 'string' ? parsed.title : undefined,
      brandName: typeof parsed.brandName === 'string' ? parsed.brandName : undefined,
      serialNumber: typeof parsed.serialNumber === 'string' ? parsed.serialNumber : undefined,
      pinCode: typeof parsed.pinCode === 'string' ? parsed.pinCode : undefined,
      value: typeof parsed.value === 'string' ? parsed.value : typeof parsed.value === 'number' ? String(parsed.value) : undefined,
      currency: typeof parsed.currency === 'string' ? parsed.currency.toUpperCase() : undefined,
      expirationDate: typeof parsed.expirationDate === 'string' ? parsed.expirationDate.slice(0, 10) : undefined,
      link: typeof parsed.link === 'string' ? parsed.link : undefined,
      notes: typeof parsed.notes === 'string' ? parsed.notes : undefined,
    }
  } catch {
    return {}
  }
}

export default async function scanVoucherHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: `Method ${req.method} not allowed` })
  }

  const { image } = req.body ?? {}
  if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
    return res.status(400).json({ message: 'A valid base64 image is required' })
  }

  const apiKey = getApiKey()
  if (!apiKey?.trim()) {
    return res.status(503).json({ message: 'Scan service is not configured' })
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: MODEL })
    const base64 = image.replace(/^data:image\/\w+;base64,/, '')
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/)
    const mimeType = mimeMatch?.[1] ?? 'image/jpeg'

    const prompt = `Analyze this voucher, coupon, gift card, or store credit image. Extract any visible information.

Return ONLY valid JSON with these optional fields (omit unknown fields):
{
  "voucherType": "coupon" | "voucher" | "credit" | "gift_card",
  "title": "short name e.g. Zara Gift Card",
  "brandName": "company or brand",
  "serialNumber": "code, serial, or barcode number",
  "pinCode": "PIN if visible",
  "value": "numeric amount only as string",
  "currency": "USD" | "EUR" | "GBP" | "ILS",
  "expirationDate": "YYYY-MM-DD",
  "link": "redemption URL if visible",
  "notes": "any other useful text"
}`

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64, mimeType } },
    ])
    const text = result.response.text()
    const data = parseScanResult(text)
    return res.status(200).json({ data })
  } catch (e) {
    console.error('scan-voucher error:', e)
    return res.status(500).json({ message: 'Failed to scan voucher' })
  }
}
