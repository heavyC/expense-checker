'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/',            label: 'Home' },
  { href: '/add-expense', label: 'Add Expense' },
  { href: '/add-policy',  label: 'Upload Policy' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
      <nav className="flex justify-center gap-8 px-6 py-4">
        {NAV_LINKS.map(({ href, label }) => (
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
    </header>
  )
}
