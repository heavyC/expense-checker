import { randomUUID } from 'crypto'
import { getChromaCollection, getCurrentPolicyVersion } from './chroma'

export async function uploadExpensePolicy(
  fileContent: string,
  filename: string
): Promise<{ success: boolean; message: string }> {
  const lines = fileContent.split('\n').filter((l) => l.trim().length > 0)

  if (lines.length === 0) {
    return { success: false, message: 'File is empty or contains no text' }
  }

  try {
    const collection = await getChromaCollection()
    const newVersion = (await getCurrentPolicyVersion(collection)) + 1
    const uploadedAt = new Date().toISOString()

    await collection.add({
      ids: lines.map(() => randomUUID()),
      documents: lines,
      metadatas: lines.map((_, i) => ({
        version: newVersion,
        filename,
        uploaded_at: uploadedAt,
        line: i,
      })),
    })

    const message = `Uploaded version ${newVersion} (${lines.length} chunks) from '${filename}'`
    return { success: true, message }
  } catch (err) {
    return { success: false, message: String(err) }
  }
}
