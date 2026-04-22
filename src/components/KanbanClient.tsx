'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lead, Status } from '@/lib/types'

const STATUS_META: Record<Status, { label: string; color: string }> = {
  new: { label: 'New', color: '#3b82f6' },
  contacted: { label: 'Contacted', color: '#f59e0b' },
  'follow-up': { label: 'Follow-up', color: '#a855f7' },
  proposal: { label: 'Proposal', color: '#06b6d4' },
  won: { label: 'Won', color: '#22c55e' },
  lost: { label: 'Lost', color: '#ef4444' },
}

interface Props {
  columns: Record<Status, Lead[]>
  statuses: Status[]
}

export default function KanbanClient({ columns, statuses }: Props) {
  const router = useRouter()
  const [draggingId, setDraggingId] = useState<string | number | null>(null)
  const [overColumn, setOverColumn] = useState<Status | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const dragSourceStatus = useRef<Status | null>(null)

  async function handleDrop(targetStatus: Status) {
    if (!draggingId || dragSourceStatus.current === targetStatus) {
      setDraggingId(null)
      setOverColumn(null)
      return
    }

    const supabase = createClient()
    await supabase
      .from('leads')
      .update({ status: targetStatus, updated_at: new Date().toISOString() })
      .eq('id', draggingId)

    setDraggingId(null)
    setOverColumn(null)
    router.refresh()
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => {
          const meta = STATUS_META[status]
          const leads = columns[status] ?? []

          return (
            <div
              key={status}
              className={`flex-shrink-0 w-72 rounded-lg border transition-colors ${
                overColumn === status
                  ? 'border-[#3b82f6] bg-[#19191d]'
                  : 'border-[#2c2c30] bg-[#19191d]'
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setOverColumn(status)
              }}
              onDragLeave={() => setOverColumn(null)}
              onDrop={(e) => {
                e.preventDefault()
                handleDrop(status)
              }}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 px-3 py-3 border-b border-[#2c2c30]">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: meta.color }}
                />
                <span className="text-sm font-medium text-[#d4d4d8]">
                  {meta.label}
                </span>
                <span className="ml-auto text-xs text-[#71717a] bg-[#222226] px-2 py-0.5 rounded-full">
                  {leads.length}
                </span>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {leads.length === 0 && (
                  <p className="text-xs text-[#71717a] text-center py-8">
                    No leads
                  </p>
                )}
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => {
                      setDraggingId(lead.id)
                      dragSourceStatus.current = status
                    }}
                    onDragEnd={() => {
                      setDraggingId(null)
                      setOverColumn(null)
                    }}
                    onClick={() => setSelectedLead(lead)}
                    className={`rounded-md border border-[#2c2c30] bg-[#222226] p-3 cursor-grab active:cursor-grabbing hover:border-[#3b82f6]/40 transition-colors ${
                      draggingId === lead.id ? 'opacity-40' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-[#d4d4d8] truncate">
                      {lead.name}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {lead.category && (
                        <span className="text-[12px] px-1.5 py-0.5 rounded bg-[#3b82f6]/10 text-[#3b82f6] truncate max-w-[120px]">
                          {lead.category}
                        </span>
                      )}
                      {lead.district && (
                        <span className="text-[12px] text-[#71717a] truncate">
                          {lead.district}
                        </span>
                      )}
                    </div>
                    {lead.phone && (
                      <p className="text-[12px] text-[#71717a] mt-1.5">
                        {lead.phone}
                      </p>
                    )}
                    {lead.profiles?.full_name && (
                      <p className="text-[12px] text-[#71717a] mt-1 truncate">
                        {lead.profiles.full_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Lead sidebar */}
      {selectedLead && (
        <LeadSidebar lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </>
  )
}

function LeadSidebar({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const meta = STATUS_META[lead.status]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#19191d] border-l border-[#2c2c30] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#2c2c30]">
          <h2 className="text-base font-semibold text-[#d4d4d8] truncate pr-4">
            {lead.name}
          </h2>
          <button
            onClick={onClose}
            className="text-[#71717a] hover:text-[#d4d4d8] transition-colors text-lg leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <span
              className="text-[12px] px-2 py-0.5 rounded font-medium"
              style={{
                backgroundColor: meta.color + '1a',
                color: meta.color,
              }}
            >
              {meta.label}
            </span>
            <span className="text-[12px] text-[#71717a] capitalize">
              {lead.priority} priority
            </span>
          </div>

          <div className="space-y-3">
            <SidebarField label="Category" value={lead.category} />
            <SidebarField label="District" value={lead.district} />
            <SidebarField label="Address" value={lead.address} />
            <SidebarField label="Phone" value={lead.phone} />
            <SidebarField label="Contact Person" value={lead.contact_person} />
            <SidebarField label="Email" value={lead.contact_email} />
            <SidebarField label="Source" value={lead.source} />
            <SidebarField label="Website" value={lead.website_url} />
            <SidebarField label="Assigned to" value={lead.profiles?.full_name} />
            <SidebarField
              label="Last Contact"
              value={lead.last_contact ? new Date(lead.last_contact).toLocaleDateString() : null}
            />
            <SidebarField
              label="Created"
              value={new Date(lead.created_at).toLocaleDateString()}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function SidebarField({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <div>
      <p className="text-[12px] text-[#71717a] mb-0.5">{label}</p>
      <p className="text-sm text-[#d4d4d8]">{value}</p>
    </div>
  )
}
