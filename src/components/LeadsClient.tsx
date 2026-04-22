'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LeadSidebar } from '@/components/LeadSidebar'
import type { Lead, Status, Profile } from '@/lib/types'

const STATUS_OPTIONS: Status[] = ['new', 'contacted', 'follow-up', 'proposal', 'won', 'lost']

const STATUS_COLORS: Record<Status, string> = {
  new: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  contacted: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'follow-up': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  proposal: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  won: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  lost: 'bg-red-500/15 text-red-400 border-red-500/20',
}

const STATUS_DOT: Record<Status, string> = {
  new: 'bg-blue-400',
  contacted: 'bg-amber-400',
  'follow-up': 'bg-purple-400',
  proposal: 'bg-cyan-400',
  won: 'bg-emerald-400',
  lost: 'bg-red-400',
}

type TeamProfile = Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>

interface LeadsClientProps {
  leads: Lead[]
  categories: string[]
  districts: string[]
  teamProfiles: TeamProfile[]
  currentUserId: string
}

export function LeadsClient({ leads, categories, districts, teamProfiles, currentUserId }: LeadsClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Status | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedDistricts, setSelectedDistricts] = useState<Set<string>>(new Set())
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)

  // Stats
  const stats = useMemo(() => {
    const counts: Record<string, number> = { total: leads.length }
    for (const s of STATUS_OPTIONS) counts[s] = 0
    for (const lead of leads) counts[lead.status] = (counts[lead.status] || 0) + 1
    return counts
  }, [leads])

  // Filtered leads
  const filtered = useMemo(() => {
    return leads.filter(lead => {
      if (statusFilter && lead.status !== statusFilter) return false
      if (selectedCategories.size > 0 && !selectedCategories.has(lead.category)) return false
      if (selectedDistricts.size > 0 && !selectedDistricts.has(lead.district)) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          lead.name.toLowerCase().includes(q) ||
          lead.category.toLowerCase().includes(q) ||
          lead.district.toLowerCase().includes(q) ||
          lead.address.toLowerCase().includes(q) ||
          lead.phone.includes(q) ||
          (lead.contact_person || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [leads, statusFilter, selectedCategories, selectedDistricts, search])

  // Active lead index in filtered list
  const activeIndex = activeLead ? filtered.findIndex(l => l.id === activeLead.id) : -1

  // Keyboard nav for sidebar
  useEffect(() => {
    if (!activeLead) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setActiveLead(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeLead])

  const navigateLead = useCallback((dir: 'prev' | 'next') => {
    if (activeIndex === -1) return
    const newIdx = dir === 'prev' ? activeIndex - 1 : activeIndex + 1
    if (newIdx >= 0 && newIdx < filtered.length) {
      setActiveLead(filtered[newIdx])
    }
  }, [activeIndex, filtered])

  // Toggle category filter
  function toggleCategory(cat: string) {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // Toggle district filter
  function toggleDistrict(d: string) {
    setSelectedDistricts(prev => {
      const next = new Set(prev)
      if (next.has(d)) next.delete(d)
      else next.add(d)
      return next
    })
  }

  // Checkbox logic
  function toggleCheck(id: number) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (checked.size === filtered.length) {
      setChecked(new Set())
    } else {
      setChecked(new Set(filtered.map(l => l.id)))
    }
  }

  // Status update
  async function updateStatus(leadId: number, newStatus: Status) {
    setUpdatingStatus(leadId)
    await supabase.from('leads').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', leadId)
    setUpdatingStatus(null)
    router.refresh()
  }

  // Bulk status update
  async function bulkUpdateStatus(newStatus: Status) {
    const ids = Array.from(checked)
    await supabase.from('leads').update({ status: newStatus, updated_at: new Date().toISOString() }).in('id', ids)
    setChecked(new Set())
    router.refresh()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Stats bar */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-5">
          <h1 className="text-xl font-semibold text-text">Leads</h1>
          <span className="text-[13px] text-muted ml-1">{leads.length} total</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-3 py-1.5 rounded text-[12px] font-medium border transition-colors cursor-pointer ${
              statusFilter === null
                ? 'bg-accent/15 text-accent border-accent/30'
                : 'bg-surface border-border text-muted hover:text-text'
            }`}
          >
            All ({stats.total})
          </button>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? null : s)}
              className={`px-3 py-1.5 rounded text-[12px] font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === s
                  ? STATUS_COLORS[s]
                  : 'bg-surface border-border text-muted hover:text-text'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s]}`} />
              {s.charAt(0).toUpperCase() + s.slice(1)} ({stats[s] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Filters row */}
      <div className="px-6 pb-3 flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3.5 3.5" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="h-8 pl-8 pr-3 bg-surface border border-border rounded text-[13px] text-text placeholder:text-muted w-[240px] focus:border-accent transition-colors"
          />
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {categories.sort().map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-2.5 py-1 rounded text-[12px] border transition-colors cursor-pointer ${
                  selectedCategories.has(cat)
                    ? 'bg-accent/15 text-accent border-accent/30'
                    : 'bg-surface border-border text-muted hover:text-text'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* District filter */}
        {districts.length > 0 && (
          <select
            value=""
            onChange={e => {
              if (e.target.value) toggleDistrict(e.target.value)
            }}
            className="h-8 px-2 bg-surface border border-border rounded text-[12px] text-muted cursor-pointer"
          >
            <option value="">District</option>
            {districts.sort().map(d => (
              <option key={d} value={d}>{d} {selectedDistricts.has(d) ? '(on)' : ''}</option>
            ))}
          </select>
        )}

        {selectedDistricts.size > 0 && (
          <div className="flex gap-1.5">
            {[...selectedDistricts].map(d => (
              <span
                key={d}
                onClick={() => toggleDistrict(d)}
                className="px-2 py-0.5 rounded text-[11px] bg-accent/15 text-accent border border-accent/30 cursor-pointer"
              >
                {d} x
              </span>
            ))}
          </div>
        )}

        {(statusFilter || selectedCategories.size > 0 || selectedDistricts.size > 0 || search) && (
          <button
            onClick={() => {
              setStatusFilter(null)
              setSelectedCategories(new Set())
              setSelectedDistricts(new Set())
              setSearch('')
            }}
            className="text-[12px] text-muted hover:text-text transition-colors cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Bulk actions */}
      {checked.size > 0 && (
        <div className="px-6 pb-3">
          <div className="flex items-center gap-3 bg-surface border border-border rounded-md px-4 py-2.5">
            <span className="text-[13px] text-text font-medium">{checked.size} selected</span>
            <div className="w-px h-4 bg-border" />
            <span className="text-[12px] text-muted">Set status:</span>
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => bulkUpdateStatus(s)}
                className={`px-2.5 py-1 rounded text-[12px] border cursor-pointer ${STATUS_COLORS[s]}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            <button
              onClick={() => setChecked(new Set())}
              className="ml-auto text-[12px] text-muted hover:text-text cursor-pointer"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface border-b border-border">
              <th className="w-10 px-3 py-2.5 text-left">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && checked.size === filtered.length}
                  onChange={toggleAll}
                  className="accent-accent cursor-pointer"
                />
              </th>
              <th className="w-12 px-3 py-2.5 text-left text-muted font-medium">#</th>
              <th className="px-3 py-2.5 text-left text-muted font-medium">Name</th>
              <th className="px-3 py-2.5 text-left text-muted font-medium">Category</th>
              <th className="px-3 py-2.5 text-left text-muted font-medium">District</th>
              <th className="px-3 py-2.5 text-left text-muted font-medium">Address</th>
              <th className="px-3 py-2.5 text-left text-muted font-medium">Phone</th>
              <th className="px-3 py-2.5 text-left text-muted font-medium">Status</th>
              <th className="px-3 py-2.5 text-left text-muted font-medium">Assigned</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead, idx) => (
              <tr
                key={lead.id}
                onClick={() => setActiveLead(lead)}
                className={`border-b border-border/50 cursor-pointer transition-colors ${
                  activeLead?.id === lead.id
                    ? 'bg-accent/5'
                    : 'hover:bg-surface2/50'
                }`}
              >
                <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={checked.has(lead.id)}
                    onChange={() => toggleCheck(lead.id)}
                    className="accent-accent cursor-pointer"
                  />
                </td>
                <td className="px-3 py-2.5 text-muted tabular-nums">{idx + 1}</td>
                <td className="px-3 py-2.5 font-medium text-text max-w-[200px] truncate">{lead.name}</td>
                <td className="px-3 py-2.5 text-muted">{lead.category}</td>
                <td className="px-3 py-2.5 text-muted">{lead.district}</td>
                <td className="px-3 py-2.5 text-muted max-w-[180px] truncate">{lead.address}</td>
                <td className="px-3 py-2.5 text-muted tabular-nums">{lead.phone}</td>
                <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                  <select
                    value={lead.status}
                    onChange={e => updateStatus(lead.id, e.target.value as Status)}
                    disabled={updatingStatus === lead.id}
                    className={`px-2 py-1 rounded text-[12px] font-medium border cursor-pointer bg-transparent ${STATUS_COLORS[lead.status]} ${
                      updatingStatus === lead.id ? 'opacity-50' : ''
                    }`}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s} className="bg-surface text-text">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2.5">
                  {lead.profiles ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface2 flex items-center justify-center text-[10px] font-medium text-muted shrink-0">
                        {lead.profiles.full_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="text-muted text-[12px] truncate">{lead.profiles.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-muted/50 text-[12px]">--</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-20 text-muted text-[14px]">
            No leads found
          </div>
        )}

        {filtered.length > 0 && (
          <div className="mt-3 text-[12px] text-muted">
            Showing {filtered.length} of {leads.length} leads
          </div>
        )}
      </div>

      {/* Sidebar */}
      {activeLead && (
        <LeadSidebar
          lead={activeLead}
          teamProfiles={teamProfiles}
          currentUserId={currentUserId}
          onClose={() => setActiveLead(null)}
          onNavigate={navigateLead}
          hasPrev={activeIndex > 0}
          hasNext={activeIndex < filtered.length - 1}
        />
      )}
    </div>
  )
}
