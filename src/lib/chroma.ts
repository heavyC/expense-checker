import { CloudClient } from 'chromadb'

export function getChromaCollection() {
  const client = new CloudClient({
    apiKey: process.env.CHROMA_API_KEY,
    tenant: process.env.CHROMA_TENANT,
    database: process.env.CHROMA_DATABASE ?? 'dev',
  })
  return client.getOrCreateCollection({ name: 'policies' })
}

export async function getCurrentPolicyVersion(
  collection: Awaited<ReturnType<typeof getChromaCollection>>
): Promise<number> {
  const result = await collection.get({ include: ['metadatas'] as any })
  const versions = result.metadatas
    .filter((m): m is Record<string, any> => m !== null)
    .map((m) => (m.version as number) ?? 0)
  return versions.length > 0 ? Math.max(...versions) : 0
}
