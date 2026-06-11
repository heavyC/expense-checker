'use client'

import { useState } from 'react'

interface Expense {
  amount: string
  category: string
  vendor: string
  description: string
  chargeToCustomer: boolean
}

const CATEGORIES = ['meals', 'travel', 'lodging', 'software', 'equipment', 'other']

const empty: Expense = {
  amount: '',
  category: '',
  vendor: '',
  description: '',
  chargeToCustomer: false,
}

export default function AddExpense() {
  const [form, setForm] = useState<Expense>(empty)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setMessage('')

    const payload = {
      ...form,
      amount: parseFloat(form.amount),
    }

    try {
      const res = await fetch('/api/analyze-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage(data.result ?? 'Expense submitted.')
        setForm(empty)
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
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
              name="chargeToCustomer"
              checked={form.chargeToCustomer}
              onChange={handleChange}
              className="h-4 w-4 rounded border-zinc-300 accent-black dark:accent-white"
            />
            Charge to customer
          </label>

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="rounded bg-black text-white py-2 px-4 text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {status === 'submitting' ? 'Submitting…' : 'Submit Expense'}
          </button>

          {message && (
            <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}
        </form>
      </main>
    </div>
  )
}
