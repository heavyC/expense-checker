import Anthropic from '@anthropic-ai/sdk'
import { getChromaCollection, getCurrentPolicyVersion } from './chroma'
import { DEFAULT_COMPLIANCE_ANALYSIS_PROMPT } from './prompts'

export interface ExpenseInput {
  amount: number
  category: string
  vendor: string
  description: string
  chargeToClient: boolean
  approvedByManager?: boolean
  _prompt?: string
}

export interface ExpenseState {
  expense: ExpenseInput
  policy_excerpts: string[]
  verdict: string
  reasoning: string
  policy_citations: string[]
  confidence: number
}

async function getPolicyExcerpts(expense: ExpenseInput): Promise<{ text: string; metadata: Record<string, any> }[]> {
  const collection = await getChromaCollection()
  const currentVersion = await getCurrentPolicyVersion(collection)

  const query = `${expense.category} expense: ${expense.description} at ${expense.vendor} for $${expense.amount.toFixed(2)}`

  const results = await collection.query({
    queryTexts: [query],
    nResults: 8,
    where: currentVersion > 0 ? { version: currentVersion } : undefined,
    include: ['documents', 'metadatas'] as any,
  })

  const excerpts: { text: string; metadata: Record<string, any> }[] = []
  const docs = results.documents[0] ?? []
  const metas = results.metadatas[0] ?? []
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i]
    if (doc && doc.trim()) {
      excerpts.push({ text: doc, metadata: (metas[i] as Record<string, any>) ?? {} })
    }
  }
  return excerpts
}

export async function analyzeExpense(expense: ExpenseInput): Promise<ExpenseState> {
  const policyExcerpts = await getPolicyExcerpts(expense)

  const policyBlock = policyExcerpts.length > 0
    ? policyExcerpts.map((e) => `- ${e.text}`).join('\n')
    : 'No specific policy rules were found in the database.'

  const promptTemplate = expense._prompt ?? DEFAULT_COMPLIANCE_ANALYSIS_PROMPT
  const prompt = promptTemplate
    .replace('{amount}', expense.amount.toFixed(2))
    .replace('{category}', expense.category)
    .replace('{vendor}', expense.vendor)
    .replace('{description}', expense.description)
    .replace('{charge_to_client}', String(expense.chargeToClient))
    .replace('{approved_by_manager}', String(expense.approvedByManager ?? false))
    .replace('{policy_block}', policyBlock)

  const client = new Anthropic()
  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = response.content.find((b) => b.type === 'text')
  const text = responseText && 'text' in responseText ? responseText.text : '{}'

  let analysis: Record<string, any>
  try {
    analysis = JSON.parse(text)
  } catch {
    analysis = {
      verdict: 'FLAGGED',
      reasoning: text,
      policy_citations: [],
      confidence: 0.5,
    }
  }

  return {
    expense,
    policy_excerpts: policyExcerpts.map((e) => e.text),
    verdict: analysis.verdict ?? 'FLAGGED',
    reasoning: analysis.reasoning ?? '',
    policy_citations: analysis.policy_citations ?? [],
    confidence: parseFloat(analysis.confidence ?? 0.5),
  }
}
