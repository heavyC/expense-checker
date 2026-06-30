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
  
console.log("*** parseReceipt env.apikey: ", process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 20) : "null");
// console.log("*** parseReceipt apikey: ", ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 20) : "null");

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')  // clear error message

  const imageB64 = imageBuffer.toString('base64')
  const anthropicClient = new Anthropic({ apiKey })  // ← pass explicitly
  // const anthropicClient = new Anthropic()
  
  const response = await anthropicClient.messages.create({
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
