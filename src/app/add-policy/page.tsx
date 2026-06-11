'use client'

import { useState, useRef } from 'react'

export default function AddPolicy() {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setStatus('uploading')
    setMessage('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/ingest-policy', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage(data.message ?? 'Policy ingested successfully.')
        if (fileRef.current) fileRef.current.value = ''
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Ingest New Expense Policy
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Policy file (.txt)
              <input
                ref={fileRef}
                type="file"
                accept=".txt"
                required
                className="mt-1 block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-200"
              />
            </label>

            <button
              type="submit"
              disabled={status === 'uploading'}
              className="rounded bg-black text-white py-2 px-4 text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {status === 'uploading' ? 'Uploading…' : 'Upload Policy'}
            </button>

            {message && (
              <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {message}
              </p>
            )}
          </form>
        </div>
      </main>
    </div>
  )
}
