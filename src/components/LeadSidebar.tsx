'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Lead, Status, Priority, Profile, Comment } from '@/lib/types'

const STATUS_OPTIONS: Status[] = ['new', 'contacted', 'follow-up', 'proposal', 'won', 'lost']
const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high']

const STATUS_DOT: Record<Status, string> = {
  new: 'bg-blue-400',
  contacted: 'bg-amber-400',
  'follow-up': 'bg-purple-400',
  proposal: 'bg-cyan-400',
  won: 'bg-emerald-400',
  lost: 'bg-red-400',
}

const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'text-muted',
  medium: 'text-amber-400',
  high: 'text-red-400',
}

type TeamProfile = Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>

interface LeadSidebarProps {
  lead: Lead
  teamProfiles: TeamProfile[]
  currentUserId: string
  onClose: () => void
  onNavigate: (dir: 'prev' | 'next') => void
  hasPrev: boolean
  hasNext: boolean
}

export function LeadSidebar({
  lead,
  teamProfiles,
  currentUserId,
  onClose,
  onNavigate,
  hasPrev,
  hasNext,
}: LeadSidebarProps) {
  const router = useRouter()
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Field states
  const [status, setStatus] = useState<Status>(lead.status)
  const [priority, setPriority] = useState<Priority>(lead.priority)
  const [assignedTo, setAssignedTo] = useState<string>(lead.assigned_to || '')
  const [contactPerson, setContactPerson] = useState(lead.contact_person || '')
  const [contactEmail, setContactEmail] = useState(lead.contact_email || '')
  const [lastContact, setLastContact] = useState(lead.last_contact || '')

  // Reset state when lead changes
  useEffect(() => {
    setStatus(lead.status)
    setPriority(lead.priority)
    setAssignedTo(lead.assigned_to || '')
    setContactPerson(lead.contact_person || '')
    setContactEmail(lead.contact_email || '')
    setLastContact(lead.last_contact || '')
    setNewComment('')
    scrollRef.current?.scrollTo(0, 0)
    loadComments()
  }, [lead.id])

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        onNavigate('prev')
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        onNavigate('next')
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onNavigate, onClose])

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(*)')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: true })
    if (data) setComments(data as Comment[])
  }

  async function saveField(field: string, value: string | null) {
    setSaving(true)
    await supabase
      .from('leads')
      .update({ [field]: value || null, updated_at: new Date().toISOString() })
      .eq('id', lead.id)
    setSaving(false)
    router.refresh()
  }

  async function addComment() {
    if (!newComment.trim()) return
    setSubmittingComment(true)
    await supabase.from('comments').insert({
      lead_id: lead.id,
      user_id: currentUserId,
      text: newComment.trim(),
    })
    setNewComment('')
    setSubmittingComment(false)
    await loadComments()
  }

  const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(lead.name + ' ' + lead.address + ' Tbilisi')}`
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(lead.name + ' Tbilisi')}`
  const callUrl = `tel:${lead.phone}`

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-screen w-[380px] bg-surface border-l border-border z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('prev')}
              disabled={!hasPrev}
              className="w-7 h-7 flex items-center justify-center rounded bg-surface2 text-muted hover:text-text disabled:opacity-30 disabled:cursor-default cursor-pointer transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 3L5 8l5 5" />
              </svg>
            </button>
            <button
              onClick={() => onNavigate('next')}
              disabled={!hasNext}
              className="w-7 h-7 flex items-center justify-center rounded bg-surface2 text-muted hover:text-text disabled:opacity-30 disabled:cursor-default cursor-pointer transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3l5 5-5 5" />
              </svg>
            </button>
          </div>

          {saving && <span className="text-[11px] text-muted">Saving...</span>}

          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded bg-surface2 text-muted hover:text-text cursor-pointer transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {/* Business name */}
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-[16px] font-semibold text-text leading-tight">{lead.name}</h2>
            <p className="text-[12px] text-muted mt-1">{lead.category} -- {lead.district}</p>

            {/* Quick links */}
            <div className="flex gap-2 mt-3">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded bg-surface2 border border-border text-[12px] text-muted hover:text-text transition-colors"
              >
                Maps
              </a>
              <a
                href={googleSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded bg-surface2 border border-border text-[12px] text-muted hover:text-text transition-colors"
              >
                Google
              </a>
              <a
                href={callUrl}
                className="px-3 py-1.5 rounded bg-surface2 border border-border text-[12px] text-muted hover:text-text transition-colors"
              >
                Call
              </a>
              {lead.website_url && (
                <a
                  href={lead.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded bg-surface2 border border-border text-[12px] text-muted hover:text-text transition-colors"
                >
                  Website
                </a>
              )}
            </div>
          </div>

          {/* Info section */}
          <div className="px-5 py-4 border-b border-border space-y-3">
            <div className="grid grid-cols-[100px_1fr] gap-y-2.5 text-[13px]">
              <span className="text-muted">Address</span>
              <span className="text-text">{lead.address}</span>

              <span className="text-muted">Phone</span>
              <a href={callUrl} className="text-text hover:text-accent transition-colors">{lead.phone}</a>

              <span className="text-muted">Source</span>
              <span className="text-text">{lead.source || '--'}</span>

              <span className="text-muted">Added</span>
              <span className="text-text">{formatDate(lead.created_at)}</span>
            </div>
          </div>

          {/* Social & Enrichment */}
          {(lead.facebook || lead.instagram || lead.tiktok || lead.email || lead.owner_name || lead.google_rating) && (
            <div className="px-5 py-4 border-b border-border space-y-3">
              <h3 className="text-[12px] font-medium text-muted uppercase tracking-wider">Enriched Data</h3>
              <div className="grid grid-cols-[100px_1fr] gap-y-2.5 text-[13px]">
                {lead.owner_name && (
                  <><span className="text-muted">Owner</span><span className="text-text">{lead.owner_name}</span></>
                )}
                {lead.email && (
                  <><span className="text-muted">Email</span><a href={`mailto:${lead.email}`} className="text-accent hover:underline">{lead.email}</a></>
                )}
                {lead.company_type && (
                  <><span className="text-muted">Company</span><span className="text-text">{lead.company_type}{lead.identification_code ? ` (${lead.identification_code})` : ''}</span></>
                )}
                {lead.google_rating && (
                  <><span className="text-muted">Rating</span><span className="text-text">{lead.google_rating} ({lead.google_reviews_count || 0} reviews)</span></>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {lead.facebook && (
                  <a href={lead.facebook} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded bg-[#1877F2]/10 border border-[#1877F2]/20 text-[12px] text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors">
                    Facebook
                  </a>
                )}
                {lead.instagram && (
                  <a href={lead.instagram} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded bg-[#E4405F]/10 border border-[#E4405F]/20 text-[12px] text-[#E4405F] hover:bg-[#E4405F]/20 transition-colors">
                    Instagram
                  </a>
                )}
                {lead.tiktok && (
                  <a href={lead.tiktok} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-[12px] text-text hover:bg-white/10 transition-colors">
                    TikTok
                  </a>
                )}
                {lead.google_maps_url && (
                  <a href={lead.google_maps_url} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[12px] text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                    Maps
                  </a>
                )}
              </div>
              {lead.enriched_at && (
                <p className="text-[10px] text-muted/40">Enriched {formatDate(lead.enriched_at)}</p>
              )}
            </div>
          )}

          {/* Pipeline fields */}
          <div className="px-5 py-4 border-b border-border space-y-3">
            <h3 className="text-[12px] font-medium text-muted uppercase tracking-wider">Pipeline</h3>

            <div className="space-y-2.5">
              <FieldRow label="Status">
                <select
                  value={status}
                  onChange={e => {
                    const v = e.target.value as Status
                    setStatus(v)
                    saveField('status', v)
                  }}
                  className="w-full h-8 px-2 bg-surface2 border border-border rounded text-[13px] text-text cursor-pointer"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </FieldRow>

              <FieldRow label="Priority">
                <select
                  value={priority}
                  onChange={e => {
                    const v = e.target.value as Priority
                    setPriority(v)
                    saveField('priority', v)
                  }}
                  className={`w-full h-8 px-2 bg-surface2 border border-border rounded text-[13px] cursor-pointer ${PRIORITY_COLORS[priority]}`}
                >
                  {PRIORITY_OPTIONS.map(p => (
                    <option key={p} value={p} className="text-text">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </FieldRow>

              <FieldRow label="Assigned to">
                <select
                  value={assignedTo}
                  onChange={e => {
                    setAssignedTo(e.target.value)
                    saveField('assigned_to', e.target.value || null)
                  }}
                  className="w-full h-8 px-2 bg-surface2 border border-border rounded text-[13px] text-text cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {teamProfiles.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </FieldRow>

              <FieldRow label="Contact">
                <input
                  type="text"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  onBlur={() => saveField('contact_person', contactPerson)}
                  placeholder="Contact person"
                  className="w-full h-8 px-2 bg-surface2 border border-border rounded text-[13px] text-text placeholder:text-muted/50"
                />
              </FieldRow>

              <FieldRow label="Email">
                <input
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  onBlur={() => saveField('contact_email', contactEmail)}
                  placeholder="Email"
                  className="w-full h-8 px-2 bg-surface2 border border-border rounded text-[13px] text-text placeholder:text-muted/50"
                />
              </FieldRow>

              <FieldRow label="Last contact">
                <input
                  type="date"
                  value={lastContact}
                  onChange={e => {
                    setLastContact(e.target.value)
                    saveField('last_contact', e.target.value || null)
                  }}
                  className="w-full h-8 px-2 bg-surface2 border border-border rounded text-[13px] text-text cursor-pointer"
                />
              </FieldRow>
            </div>
          </div>

          {/* Comments */}
          <div className="px-5 py-4">
            <h3 className="text-[12px] font-medium text-muted uppercase tracking-wider mb-3">Comments</h3>

            <div className="space-y-3 mb-4">
              {comments.length === 0 && (
                <p className="text-[13px] text-muted/50">No comments yet</p>
              )}
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-surface2 flex items-center justify-center text-[10px] font-medium text-muted shrink-0 mt-0.5">
                    {comment.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[12px] font-medium text-text">
                        {comment.profiles?.full_name || 'Unknown'}
                      </span>
                      <span className="text-[11px] text-muted/60">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-[13px] text-text/80 mt-0.5 whitespace-pre-wrap break-words">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add comment */}
            <div className="flex gap-2">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    addComment()
                  }
                }}
                placeholder="Add a comment..."
                rows={2}
                className="flex-1 px-3 py-2 bg-surface2 border border-border rounded text-[13px] text-text placeholder:text-muted/50 resize-none"
              />
              <button
                onClick={addComment}
                disabled={submittingComment || !newComment.trim()}
                className="self-end px-3 py-2 bg-accent hover:bg-accent-hover text-white text-[12px] font-medium rounded disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-muted w-[80px] shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function formatDate(dateStr: string) {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
