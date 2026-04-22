'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/types'

const navItems = [
  { href: '/leads', label: 'Leads', icon: LeadsIcon },
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/team', label: 'Team', icon: TeamIcon },
]

export function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-surface border-r border-border flex flex-col z-40">
      <div className="px-5 py-6">
        <span className="text-lg font-semibold tracking-tight text-text">CRM</span>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 px-2">
        {navItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-colors relative ${
                isActive
                  ? 'text-text bg-surface2'
                  : 'text-muted hover:text-text hover:bg-surface2/50'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r" />
              )}
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-[12px] font-medium text-muted">
            {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-text truncate">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-[12px] text-muted truncate">
              {profile?.role || 'Member'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left text-[12px] text-muted hover:text-text transition-colors px-1 cursor-pointer"
        >
          Log out
        </button>
      </div>
    </aside>
  )
}

function LeadsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h12M2 8h12M2 12h8" />
    </svg>
  )
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="3" rx="1" />
      <rect x="9" y="6" width="6" height="9" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
    </svg>
  )
}

function TeamIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5" />
    </svg>
  )
}
