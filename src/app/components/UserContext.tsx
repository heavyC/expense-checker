'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type UserRole = 'active' | 'inactive' | 'admin'

export interface User {
  id: number
  first_name: string
  last_name: string
  login_id: string
  role: UserRole
}

interface UserContextValue {
  currentUser: User | null
  loading: boolean
  login: (loginId: string) => Promise<{ error?: string }>
  logout: () => void
  createUser: (fields: { firstName: string; lastName: string; loginId: string; role: UserRole }) => Promise<{ error?: string }>
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedId = localStorage.getItem('userId')
    if (!savedId) { setLoading(false); return }

    fetch(`/api/users?loginId=${encodeURIComponent(savedId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(user => { if (user) setCurrentUser(user) })
      .finally(() => setLoading(false))
  }, [])

  async function login(loginId: string): Promise<{ error?: string }> {
    const res = await fetch(`/api/users?loginId=${encodeURIComponent(loginId)}`)
    if (res.status === 404) return { error: 'No user found with that Login ID' }
    if (!res.ok) return { error: 'Something went wrong' }
    const user: User = await res.json()
    localStorage.setItem('userId', user.login_id)
    setCurrentUser(user)
    return {}
  }

  function logout() {
    localStorage.removeItem('userId')
    setCurrentUser(null)
  }

  async function createUser(fields: { firstName: string; lastName: string; loginId: string; role: UserRole }): Promise<{ error?: string }> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    if (res.status === 409) return { error: 'Login ID already taken' }
    if (!res.ok) return { error: 'Something went wrong' }
    const user: User = await res.json()
    localStorage.setItem('userId', user.login_id)
    setCurrentUser(user)
    return {}
  }

  return (
    <UserContext.Provider value={{ currentUser, loading, login, logout, createUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside UserProvider')
  return ctx
}
