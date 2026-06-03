'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { disconnectSocket } from '@/lib/socket'

const navItems = [
  { label: 'Nodes', href: '/nodes', icon: '📡' },
  { label: 'Tracks', href: '/tracks', icon: '🎵' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearAuth } = useStore()

  const handleLogout = () => {
    disconnectSocket()
    clearAuth()
    router.push('/login')
  }

  return (
    <aside className="w-60 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-800">
        <h1 className="text-white font-bold text-lg">AUD Platform</h1>
        <p className="text-gray-500 text-xs mt-0.5">Broadcasting Control</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              pathname === item.href
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-800">
        <p className="text-gray-400 text-xs truncate mb-2">{user?.email}</p>
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-red-400 hover:text-red-300 transition-colors px-2 py-1"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}