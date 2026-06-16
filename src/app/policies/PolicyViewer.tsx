'use client'

import { useEffect, useState } from 'react'

interface PolicyDoc {
  line: number
  text: string
}

interface PolicyVersion {
  version: number
  filename: string
  uploaded_at: string
  documents: PolicyDoc[]
}

function PolicyLine({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <li className="flex items-start gap-2 py-1 group">
      <span
        className={`flex-1 text-sm text-zinc-700 dark:text-zinc-300 leading-snug ${
          expanded ? '' : 'truncate'
        }`}
      >
        {text}
      </span>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="shrink-0 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors mt-0.5"
      >
        {expanded ? 'collapse' : 'expand'}
      </button>
    </li>
  )
}

export default function PolicyViewer() {
  const [versions, setVersions] = useState<PolicyVersion[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/list-policies')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setVersions(data)
      })
      .catch((e) => setError(String(e)))
  }, [])

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>
  }

  if (!versions) {
    return <p className="text-sm text-zinc-400">Loading…</p>
  }

  if (versions.length === 0) {
    return <p className="text-sm text-zinc-500">No policy documents uploaded yet.</p>
  }

  return (
    <div className="flex flex-col gap-8">
      {versions.map((v) => (
        <section
          key={v.version}
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col gap-3"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-base font-semibold text-black dark:text-white">
              Version {v.version}
            </h2>
            <div className="flex flex-col items-end gap-0.5 text-right">
              <span className="text-xs text-zinc-400">{v.filename}</span>
              {v.uploaded_at && (
                <span className="text-xs text-zinc-400">
                  {new Date(v.uploaded_at).toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
            {v.documents.map((doc) => (
              <PolicyLine key={doc.line} text={doc.text} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
