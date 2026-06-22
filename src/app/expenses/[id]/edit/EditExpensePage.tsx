'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '../../../components/UserContext'

const CATEGORIES = ['meals', 'travel', 'lodging', 'software', 'equipment', 'other']

interface ExpenseData {
  id: number
  amount: string
  category: string
  vendor: string
  description: string
  charge_to_client: boolean
  created_by: number
}

export default function EditExpensePage({ id }: { id: string }) {
  const { currentUser, loading: userLoading } = useUser()
  const router = useRouter()

  const [expense, setExpense] = useState<ExpenseData | null>(null)
  const [form, setForm] = useState({ amount: '', category: '', vendor: '', description: '', chargeToClient: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/expenses/${id}`)
      .then(r => r.json())
      .then((data: ExpenseData) => {
        setExpense(data)
        setForm({
          amount: parseFloat(data.amount).toFixed(2),
          category: data.category,
          vendor: data.vendor,
          description: data.description ?? '',
          chargeToClient: data.charge_to_client,
        })
      })
      .catch(() => setError('Failed to load expense.'))
      .finally(() => setLoading(false))
  }, [id])

  if (userLoading || loading) return <div className="p-8 text-sm text-zinc-500">Loading…</div>

  if (!currentUser || (expense && currentUser.id !== expense.created_by)) {
    return <div className="p-8 text-sm text-zinc-500">You do not have permission to edit this expense.</div>
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch(`/api/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    })

    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Save failed.')
      return
    }
    router.push('/expenses')
  }

  const inputClass = 'mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-white'
  const labelClass = 'flex flex-col text-sm font-medium text-zinc-700 dark:text-zinc-300'

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-16 px-16 bg-white dark:bg-black">
        <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50 mb-2">
          Edit Expense
        </h1>
        <p className="text-sm text-zinc-400 mb-8">#{id}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-sm">
          <label className={labelClass}>
            Amount ($)
            <input type="number" name="amount" value={form.amount} onChange={handleChange}
              min="0" step="0.01" required className={inputClass} />
          </label>

          <label className={labelClass}>
            Category
            <select name="category" value={form.category} onChange={handleChange} required className={inputClass}>
              <option value="" disabled>Select a category</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Vendor
            <input type="text" name="vendor" value={form.vendor} onChange={handleChange}
              required placeholder="e.g. Delta Airlines" className={inputClass} />
          </label>

          <label className={labelClass}>
            Description
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={3} className={inputClass} />
          </label>

          <label className="flex flex-row items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
            <input type="checkbox" name="chargeToClient" checked={form.chargeToClient} onChange={handleChange}
              className="h-4 w-4 rounded border-zinc-300 accent-black dark:accent-white" />
            Charge to Client
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="rounded bg-black text-white py-2 px-4 text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => router.push('/expenses')}
              className="rounded border border-zinc-300 dark:border-zinc-700 py-2 px-4 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900">
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
