'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { Barn } from '@/lib/types'
import { Home, Calendar, PawPrint, Settings, HelpCircle, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

interface DashboardNavProps {
  user: User
  barns: Barn[]
}

export function DashboardNav({ user, barns }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Extract current barn ID from URL
  const barnIdMatch = pathname.match(/\/dashboard\/barn\/([^/]+)/)
  const currentBarnId = barnIdMatch ? barnIdMatch[1] : barns[0]?.id

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navItems = currentBarnId ? [
    { href: `/dashboard/barn/${currentBarnId}`, label: 'Chores', icon: Home },
    { href: `/dashboard/barn/${currentBarnId}/calendar`, label: 'Calendar', icon: Calendar },
    { href: `/dashboard/barn/${currentBarnId}/animals`, label: 'Animals', icon: PawPrint },
    { href: `/dashboard/barn/${currentBarnId}/settings`, label: 'Settings', icon: Settings },
    { href: `/dashboard/help`, label: 'Help', icon: HelpCircle },
  ] : []

  const isActive = (href: string) => {
    if (href.includes('/calendar')) return pathname.includes('/calendar')
    if (href.includes('/animals')) return pathname.includes('/animals')
    if (href.includes('/settings')) return pathname.includes('/settings')
    if (href.includes('/help')) return pathname.includes('/help')
    // For chores (root barn page), be more specific
    return pathname === href
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-stable-200">
        {/* Logo */}
        <div className="p-6 border-b border-stable-100">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stable-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">🐴</span>
            </div>
            <span className="text-xl font-bold text-stable-800">Stable</span>
          </Link>
        </div>

        {/* Barn Selector */}
        {barns.length > 0 && (
          <div className="p-4 border-b border-stable-100">
            <label className="text-xs font-medium text-stable-500 uppercase tracking-wider">
              Current Barn
            </label>
            <select
              value={currentBarnId || ''}
              onChange={(e) => router.push(`/dashboard/barn/${e.target.value}`)}
              className="mt-2 w-full px-3 py-2 bg-stable-50 border border-stable-200 rounded-lg text-stable-700 font-medium"
            >
              {barns.map((barn) => (
                <option key={barn.id} value={barn.id}>
                  {barn.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  active
                    ? 'bg-stable-100 text-stable-800 font-semibold'
                    : 'text-stable-600 hover:bg-stable-50 hover:text-stable-800'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-stable-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-stable-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-stable-600">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stable-800 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-4 py-2 text-stable-500 hover:text-stable-700 hover:bg-stable-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stable-200 z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 p-2 ${
                  active ? 'text-stable-700' : 'text-stable-400'
                }`}
              >
                <Icon size={22} />
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 p-2 text-stable-400"
          >
            <Menu size={22} />
            <span className="text-xs">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white p-6" onClick={e => e.stopPropagation()}>
            <button onClick={() => setMobileMenuOpen(false)} className="absolute top-4 right-4">
              <X size={24} />
            </button>
            <div className="mt-8 space-y-4">
              <Link href="/dashboard/help" className="block py-2 text-stable-700">Help & Info</Link>
              <button onClick={handleSignOut} className="block py-2 text-stable-500">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
