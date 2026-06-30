import Anthropic from '@anthropic-ai/sdk'
import { DEFAULT_RECEIPT_PARSING_PROMPT } from './prompts'

const VALID_CATEGORIES = ['meals', 'travel', 'lodging', 'software', 'equipment', 'other'] as const

export interface ParsedReceipt {
  amount: number
  category: string
  vendor: string
  description: string
  chargeToClient: boolean
  accuracy: number
}

export async function parseReceipt(
  imageBuffer: Buffer,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
  prompt?: string | null
): Promise<ParsedReceipt> {
  const imageB64 = imageBuffer.toString('base64')
  const client = new Anthropic()

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageB64,
            },
          },
          { type: 'text', text: prompt ?? DEFAULT_RECEIPT_PARSING_PROMPT },
        ],
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  const text = textBlock && 'text' in textBlock ? textBlock.text : '{}'

  let data: Record<string, any>
  try {
    data = JSON.parse(text)
  } catch {
    data = { amount: 0, category: 'other', vendor: '', description: '', chargeToClient: false, accuracy: 0 }
  }

  if (!VALID_CATEGORIES.includes(data.category)) data.category = 'other'

  return {
    amount: parseFloat(data.amount ?? 0),
    category: data.category,
    vendor: data.vendor ?? '',
    description: data.description ?? '',
    chargeToClient: Boolean(data.chargeToClient),
    accuracy: parseFloat(data.accuracy ?? 0),
  }
}
