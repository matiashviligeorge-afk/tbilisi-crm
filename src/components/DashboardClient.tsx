'use client'

import { Lead, ActivityLog, Profile, Status } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

const STATUS_COLORS: Record<Status, string> = {
  new: '#3b82f6',
  contacted: '#f59e0b',
  'follow-up': '#a855f7',
  proposal: '#06b6d4',
  won: '#22c55e',
  lost: '#ef4444',
}

const STATUS_LABELS: Record<Status, string> = {
  new: 'New',
  contacted: 'Contacted',
  'follow-up': 'Follow-up',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
}

interface Props {
  leads: Lead[]
  activityLogs: ActivityLog[]
  commentsCount: number
  profiles: Profile[]
}

export default function DashboardClient({
  leads,
  activityLogs,
  commentsCount,
  profiles,
}: Props) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const totalLeads = leads.length
  const activeStatuses: Status[] = ['new', 'contacted', 'follow-up', 'proposal']
  const activePipeline = leads.filter((l) => activeStatuses.includes(l.status)).length
  const wonThisMonth = leads.filter(
    (l) => l.status === 'won' && new Date(l.updated_at) >= monthStart
  ).length
  const closedLeads = leads.filter((l) => l.status === 'won' || l.status === 'lost').length
  const conversionRate = closedLeads > 0 ? Math.round((leads.filter((l) => l.status === 'won').length / closedLeads) * 100) : 0

  // Category breakdown
  const categoryMap: Record<string, number> = {}
  for (const l of leads) {
    if (l.category) {
      categoryMap[l.category] = (categoryMap[l.category] || 0) + 1
    }
  }
  const categories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  const categoryMax = categories.length > 0 ? categories[0][1] : 1

  // Status breakdown
  const statusMap: Record<Status, number> = {
    new: 0,
    contacted: 0,
    'follow-up': 0,
    proposal: 0,
    won: 0,
    lost: 0,
  }
  for (const l of leads) {
    statusMap[l.status] = (statusMap[l.status] || 0) + 1
  }
  const statusEntries = (Object.entries(statusMap) as [Status, number][]).filter(
    ([, count]) => count > 0
  )
  const statusTotal = statusEntries.reduce((sum, [, c]) => sum + c, 0)

  // Donut: conic-gradient segments
  let conicParts: string[] = []
  let accumulated = 0
  for (const [status, count] of statusEntries) {
    const pct = (count / (statusTotal || 1)) * 100
    const start = accumulated
    accumulated += pct
    conicParts.push(`${STATUS_COLORS[status]} ${start}% ${accumulated}%`)
  }
  const conicGradient = conicParts.length > 0 ? `conic-gradient(${conicParts.join(', ')})` : 'conic-gradient(#2c2c30 0% 100%)'

  // District breakdown
  const districtMap: Record<string, number> = {}
  for (const l of leads) {
    if (l.district) {
      districtMap[l.district] = (districtMap[l.district] || 0) + 1
    }
  }
  const districts = Object.entries(districtMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  const districtMax = districts.length > 0 ? districts[0][1] : 1

  // Agent performance
  const agentStats: Record<
    string,
    { name: string; assigned: number; won: number; contacted: number }
  > = {}
  for (const p of profiles) {
    agentStats[p.id] = { name: p.full_name || p.email, assigned: 0, won: 0, contacted: 0 }
  }
  for (const l of leads) {
    if (l.assigned_to && agentStats[l.assigned_to]) {
      agentStats[l.assigned_to].assigned++
      if (l.status === 'won') agentStats[l.assigned_to].won++
      if (l.status === 'contacted') agentStats[l.assigned_to].contacted++
    }
  }
  const agents = Object.values(agentStats).filter((a) => a.assigned > 0)

  return (
    <div className="space-y-6">
      {/* Row 1: Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={totalLeads} />
        <StatCard label="Active Pipeline" value={activePipeline} />
        <StatCard label="Won This Month" value={wonThisMonth} />
        <StatCard label="Conversion Rate" value={`${conversionRate}%`} />
      </div>

      {/* Row 2: Category + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leads by Category */}
        <div className="rounded-lg border border-[#2c2c30] bg-[#19191d] p-4">
          <h2 className="text-sm font-medium text-[#d4d4d8] mb-4">Leads by Category</h2>
          <div className="space-y-2.5">
            {categories.length === 0 && (
              <p className="text-sm text-[#71717a]">No data</p>
            )}
            {categories.map(([cat, count]) => (
              <div key={cat}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-[#d4d4d8] truncate mr-2">{cat}</span>
                  <span className="text-[#71717a] flex-shrink-0">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-[#222226]">
                  <div
                    className="h-2 rounded-full bg-[#3b82f6]"
                    style={{ width: `${(count / categoryMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leads by Status - Donut */}
        <div className="rounded-lg border border-[#2c2c30] bg-[#19191d] p-4">
          <h2 className="text-sm font-medium text-[#d4d4d8] mb-4">Leads by Status</h2>
          <div className="flex items-center gap-6">
            <div
              className="w-36 h-36 rounded-full flex-shrink-0 relative"
              style={{ background: conicGradient }}
            >
              <div className="absolute inset-5 rounded-full bg-[#19191d] flex items-center justify-center">
                <span className="text-lg font-semibold text-[#d4d4d8]">{statusTotal}</span>
              </div>
            </div>
            <div className="space-y-2 min-w-0">
              {statusEntries.map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[status] }}
                  />
                  <span className="text-[12px] text-[#d4d4d8]">{STATUS_LABELS[status]}</span>
                  <span className="text-[12px] text-[#71717a] ml-auto">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: District + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leads by District */}
        <div className="rounded-lg border border-[#2c2c30] bg-[#19191d] p-4">
          <h2 className="text-sm font-medium text-[#d4d4d8] mb-4">Leads by District</h2>
          <div className="space-y-2.5">
            {districts.length === 0 && (
              <p className="text-sm text-[#71717a]">No data</p>
            )}
            {districts.map(([district, count]) => (
              <div key={district}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-[#d4d4d8] truncate mr-2">{district}</span>
                  <span className="text-[#71717a] flex-shrink-0">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-[#222226]">
                  <div
                    className="h-2 rounded-full bg-[#a855f7]"
                    style={{ width: `${(count / districtMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border border-[#2c2c30] bg-[#19191d] p-4">
          <h2 className="text-sm font-medium text-[#d4d4d8] mb-4">Recent Activity</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activityLogs.length === 0 && (
              <p className="text-sm text-[#71717a]">No activity yet</p>
            )}
            {activityLogs.map((log) => (
              <div key={log.id} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-1.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-[#d4d4d8]">
                    <span className="font-medium">
                      {log.profiles?.full_name || 'Unknown'}
                    </span>{' '}
                    <span className="text-[#71717a]">{log.action}</span>
                    {log.new_value && (
                      <span className="text-[#71717a]"> to {log.new_value}</span>
                    )}
                  </p>
                  <p className="text-[12px] text-[#71717a] mt-0.5">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Agent Performance */}
      <div className="rounded-lg border border-[#2c2c30] bg-[#19191d] p-4">
        <h2 className="text-sm font-medium text-[#d4d4d8] mb-4">Agent Performance</h2>
        {agents.length === 0 ? (
          <p className="text-sm text-[#71717a]">No assigned leads yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2c2c30]">
                  <th className="text-left py-2 pr-4 text-[12px] font-medium text-[#71717a]">
                    Agent
                  </th>
                  <th className="text-right py-2 px-4 text-[12px] font-medium text-[#71717a]">
                    Assigned
                  </th>
                  <th className="text-right py-2 px-4 text-[12px] font-medium text-[#71717a]">
                    Won
                  </th>
                  <th className="text-right py-2 pl-4 text-[12px] font-medium text-[#71717a]">
                    Contacted
                  </th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.name} className="border-b border-[#2c2c30] last:border-0">
                    <td className="py-2.5 pr-4 text-[#d4d4d8]">{agent.name}</td>
                    <td className="py-2.5 px-4 text-right text-[#d4d4d8]">{agent.assigned}</td>
                    <td className="py-2.5 px-4 text-right text-[#22c55e]">{agent.won}</td>
                    <td className="py-2.5 pl-4 text-right text-[#f59e0b]">{agent.contacted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[#2c2c30] bg-[#19191d] p-4">
      <p className="text-[12px] text-[#71717a] mb-1">{label}</p>
      <p className="text-2xl font-semibold text-[#d4d4d8]">{value}</p>
    </div>
  )
}
