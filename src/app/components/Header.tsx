'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useUser, UserRole } from './UserContext'

const USER_LINKS = [
  { href: '/',            label: 'Home' },
  { href: '/add-expense', label: 'Add Expense' },
  { href: '/expenses',    label: 'View Expense Reports' },
]

const ADMIN_LINKS = [
  { href: '/review',         label: 'Ready for Compliance Review' },
  { href: '/add-policy',     label: 'Upload a New Policy Document' },
  { href: '/policies',       label: 'View All Expense Policy Docs' },
  { href: '/update-prompts', label: 'View & Update Prompts' },
]

const ROLE_BADGE: Record<UserRole, string> = {
  active:   'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  inactive: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  admin:    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

type Modal = 'login' | 'create' | null

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, loading, login, logout, createUser } = useUser()

  const [modal, setModal] = useState<Modal>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Login form state
  const [loginId, setLoginId] = useState('')

  // Create user form state
  const [form, setForm] = useState({ firstName: '', lastName: '', loginId: '', role: 'active' as UserRole })

  function openModal(m: Modal) { setModal(m); setError(''); setLoginId(''); setForm({ firstName: '', lastName: '', loginId: '', role: 'active' }) }
  function closeModal() { setModal(null); setError('') }

  async function handleLogin(e: React.SyntheticEvent) {
    e.preventDefault()
    setSubmitting(true)
    const result = await login(loginId)
    setSubmitting(false)
    if (result.error) { setError(result.error); return }
    closeModal()
  }

  async function handleCreate(e: React.SyntheticEvent) {
    e.preventDefault()
    setSubmitting(true)
    const result = await createUser(form)
    setSubmitting(false)
    if (result.error) { setError(result.error); return }
    closeModal()
  }

  const inputCls = 'w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white'
  const btnPrimary = 'rounded bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-80 disabled:opacity-50'
  const btnGhost = 'rounded border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900'

  return (
    <>
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
        {/* Top row: user links + auth */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 dark:border-zinc-900">
          <nav className="flex items-center gap-8">
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide shrink-0">Users:</span>
            {USER_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'text-black dark:text-white'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {loading ? null : currentUser ? (
              <>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Hello <span className="font-medium text-black dark:text-white">{currentUser.first_name}</span>
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${ROLE_BADGE[currentUser.role]}`}>
                  {currentUser.role}
                </span>
                <button onClick={() => { logout(); router.push('/') }} className={btnGhost}>Logout</button>
              </>
            ) : (
              <>
                <button onClick={() => openModal('login')} className={btnGhost}>Login</button>
                <button onClick={() => openModal('create')} className={btnPrimary}>Create Account</button>
              </>
            )}
          </div>
        </div>

        {/* Bottom row: admin links — only shown to admins */}
        {currentUser?.role === 'admin' && (
          <nav className="flex items-center gap-8 px-6 py-2">
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide shrink-0">Admins:</span>
            {ADMIN_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-xs font-medium transition-colors ${
                  pathname === href
                    ? 'text-black dark:text-white'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Overlay */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-zinc-950 p-6 shadow-xl" onClick={e => e.stopPropagation()}>

            {modal === 'login' && (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold">Login</h2>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500 uppercase tracking-wide">Login ID</label>
                  <input className={inputCls} value={loginId} onChange={e => setLoginId(e.target.value)} autoFocus required />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={closeModal} className={btnGhost}>Cancel</button>
                  <button type="submit" disabled={submitting} className={btnPrimary}>{submitting ? 'Logging in…' : 'Login'}</button>
                </div>
              </form>
            )}

            {modal === 'create' && (
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold">Create Account</h2>
                <div className="flex gap-3">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs text-zinc-500 uppercase tracking-wide">First Name</label>
                    <input className={inputCls} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs text-zinc-500 uppercase tracking-wide">Last Name</label>
                    <input className={inputCls} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500 uppercase tracking-wide">Login ID</label>
                  <input className={inputCls} value={form.loginId} onChange={e => setForm(f => ({ ...f, loginId: e.target.value }))} required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500 uppercase tracking-wide">Role</label>
                  <select className={inputCls} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={closeModal} className={btnGhost}>Cancel</button>
                  <button type="submit" disabled={submitting} className={btnPrimary}>{submitting ? 'Creating…' : 'Create Account'}</button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </>
  )
}
