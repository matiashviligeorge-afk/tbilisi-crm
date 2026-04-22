import { createClient } from '@/lib/supabase/server'
import { Lead, Status } from '@/lib/types'
import KanbanClient from '@/components/KanbanClient'

const STATUSES: Status[] = ['new', 'contacted', 'follow-up', 'proposal', 'won', 'lost']

export default async function PipelinePage() {
  const supabase = await createClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('*, profiles(*)')
    .order('updated_at', { ascending: false })

  const grouped: Record<Status, Lead[]> = {
    new: [],
    contacted: [],
    'follow-up': [],
    proposal: [],
    won: [],
    lost: [],
  }

  for (const lead of (leads ?? []) as Lead[]) {
    if (grouped[lead.status]) {
      grouped[lead.status].push(lead)
    }
  }

  return (
    <div className="min-h-screen bg-[#111] p-6">
      <h1 className="text-xl font-semibold text-[#d4d4d8] mb-6">Pipeline</h1>
      <KanbanClient columns={grouped} statuses={STATUSES} />
    </div>
  )
}
