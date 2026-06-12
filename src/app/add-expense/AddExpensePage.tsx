'use client'

import { useRef, useState } from 'react'

interface Expense {
  amount: string
  category: string
  vendor: string
  description: string
  chargeToClient: boolean
}

interface AnalysisResult {
  verdict: 'APPROVED' | 'FLAGGED' | 'NEEDS_REVIEW'
  reasoning: string
  policy_citations: string[]
  confidence: number
  policy_excerpts: string[]
}

interface ReceiptResult {
  amount: number
  category: string
  vendor: string
  description: string
  chargeToClient: boolean
  accuracy: number
}

const CATEGORIES = ['meals', 'travel', 'lodging', 'software', 'equipment', 'other']

// const empty: Expense = {
//   amount: '85.00',
//   category: 'meals',
//   vendor: 'Chipotle',
//   description: 'team lunch',
//   chargeToClient: false,
// }
const empty: Expense = {
  amount: '',
  category: '',
  vendor: '',
  description: '',
  chargeToClient: false,
}

const verdictStyles: Record<AnalysisResult['verdict'], { bar: string; badge: string; label: string }> = {
  APPROVED:     { bar: 'bg-green-500',  badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',  label: 'Approved' },
  FLAGGED:      { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',          label: 'Flagged' },
  NEEDS_REVIEW: { bar: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Needs Review' },
}

function ConfidenceBar({ pct, barColor }: { pct: number; barColor: string }) {
  return (
    <div className="flex flex-1 items-center gap-2">
      <div className="relative h-2 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div className={`absolute left-0 top-0 h-2 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums w-14 text-right">{pct}%</span>
    </div>
  )
}

function ReceiptPanel({ receipt, fileName }: { receipt: ReceiptResult; fileName: string }) {
  const pct = Math.round(receipt.accuracy * 100)
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-500'

  return (
    <div className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-700 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Receipt Parsed</h2>
        <div className="flex items-center gap-2 w-40">
          <ConfidenceBar pct={pct} barColor={color} />
          <span className="text-xs text-zinc-400">accuracy</span>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {[
          ['Vendor',    receipt.vendor],
          ['Amount',    `$${receipt.amount.toFixed(2)}`],
          ['Category',  receipt.category.charAt(0).toUpperCase() + receipt.category.slice(1)],
          ['Description', receipt.description],
          ['Charge to Client', receipt.chargeToClient ? 'Yes' : 'No'],
        ].map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
            <dd className="text-zinc-800 dark:text-zinc-200 font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function ResultPanel({ result }: { result: AnalysisResult }) {
  const style = verdictStyles[result.verdict] ?? verdictStyles.NEEDS_REVIEW
  const pct = Math.round(result.confidence * 100)

  return (
    <div className="mt-10 flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${style.badge}`}>
          {style.label}
        </span>
        <ConfidenceBar pct={pct} barColor={style.bar} />
        <span className="text-xs text-zinc-400">confidence</span>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Reasoning</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{result.reasoning}</p>
      </div>

      {result.policy_citations.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Policy Citations</h2>
          <ul className="flex flex-col gap-1">
            {result.policy_citations.map((c, i) => (
              <li key={i} className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.policy_excerpts.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-zinc-500 dark:text-zinc-400 select-none">
            Retrieved policy excerpts ({result.policy_excerpts.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-1 border-l-2 border-zinc-200 dark:border-zinc-700 pl-4">
            {result.policy_excerpts.map((e, i) => (
              <li key={i} className="text-xs text-zinc-500 leading-relaxed">{e}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

export default function AddExpensePage() {
  const [form, setForm] = useState<Expense>(empty)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [receiptStatus, setReceiptStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle')
  const [receiptResult, setReceiptResult] = useState<ReceiptResult | null>(null)
  const [receiptError, setReceiptError] = useState('')
  const [receiptFileName, setReceiptFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setReceiptStatus('parsing')
    setReceiptResult(null)
    setReceiptError('')
    setReceiptFileName(file.name)

    const fd = new FormData()
    fd.append('receipt', file)

    try {
      const res = await fetch('/api/parse-receipt', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        const r: ReceiptResult = data.result
        setReceiptResult(r)
        setReceiptStatus('done')
        setForm({
          amount: r.amount.toFixed(2),
          category: r.category,
          vendor: r.vendor,
          description: r.description,
          chargeToClient: r.chargeToClient,
        })
      } else {
        setReceiptStatus('error')
        setReceiptError(data.error ?? 'Failed to parse receipt.')
      }
    } catch {
      setReceiptStatus('error')
      setReceiptError('Network error. Please try again.')
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setResult(null)
    setErrorMessage('')

    const payload = { ...form, amount: parseFloat(form.amount) }

    try {
      const res = await fetch('/api/analyze-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setResult(data.result)
      } else {
        setStatus('error')
        setErrorMessage(data.error ?? 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Network error. Please try again.')
    }
  }

  const inputClass =
    'mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-white'
  const labelClass = 'flex flex-col text-sm font-medium text-zinc-700 dark:text-zinc-300'

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-32 px-16 bg-white dark:bg-black">
        <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50 mb-8">
          Add an Expense
        </h1>

        {/* Receipt upload */}
        <div className="mb-8 w-full max-w-sm">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Upload a receipt to auto-fill</p>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded border-2 border-dashed border-zinc-300 dark:border-zinc-600 px-4 py-5 text-sm text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">
            {receiptStatus === 'parsing' ? 'Parsing receipt…' : 'Choose image (JPEG, PNG, WebP)'}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="sr-only"
              onChange={handleReceiptUpload}
              disabled={receiptStatus === 'parsing'}
            />
          </label>
          {receiptStatus === 'error' && (
            <p className="mt-2 text-xs text-red-600">{receiptError}</p>
          )}
          {receiptResult && <ReceiptPanel receipt={receiptResult} fileName={receiptFileName} />}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-sm">
          <label className={labelClass}>
            Amount ($)
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              placeholder="0.00"
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Category
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="" disabled>Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Vendor
            <input
              type="text"
              name="vendor"
              value={form.vendor}
              onChange={handleChange}
              required
              placeholder="e.g. Delta Airlines"
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Brief description of the expense"
              className={inputClass}
            />
          </label>

          <label className="flex flex-row items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              name="chargeToClient"
              checked={form.chargeToClient}
              onChange={handleChange}
              className="h-4 w-4 rounded border-zinc-300 accent-black dark:accent-white"
            />
            Charge to Client
          </label>

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="rounded bg-black text-white py-2 px-4 text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {status === 'submitting' ? 'Analyzing…' : 'Submit Expense'}
          </button>

          {status === 'error' && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
        </form>

        {result && <ResultPanel result={result} />}
      </main>
    </div>
  )
}
