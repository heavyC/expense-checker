import { getChromaCollection } from './chroma'

export interface PolicyVersion {
  version: number
  filename: string
  uploaded_at: string
  documents: { line: number; text: string }[]
}

export async function listPolicies(): Promise<PolicyVersion[]> {
  const collection = await getChromaCollection()
  const result = await collection.get({ include: ['documents', 'metadatas'] as any })

  const versions: Record<number, PolicyVersion> = {}

  for (let i = 0; i < result.ids.length; i++) {
    const meta = result.metadatas[i] as Record<string, any> | null
    const doc = result.documents[i]
    if (!meta || meta.version === undefined) continue

    const v = meta.version as number
    if (!versions[v]) {
      versions[v] = {
        version: v,
        filename: meta.filename ?? 'unknown',
        uploaded_at: meta.uploaded_at ?? '',
        documents: [],
      }
    }
    versions[v].documents.push({ line: meta.line ?? 0, text: doc ?? '' })
  }

  for (const entry of Object.values(versions)) {
    entry.documents.sort((a, b) => a.line - b.line)
  }

  return Object.values(versions).sort((a, b) => b.version - a.version)
}
