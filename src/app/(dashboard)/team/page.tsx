import { createClient } from '@/lib/supabase/server'
import { Profile } from '@/lib/types'
import TeamClient from '@/components/TeamClient'

export default async function TeamPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  const { data: leads } = await supabase
    .from('leads')
    .select('assigned_to')

  // Count leads per agent
  const leadsPerAgent: Record<string, number> = {}
  for (const lead of leads ?? []) {
    if (lead.assigned_to) {
      leadsPerAgent[lead.assigned_to] = (leadsPerAgent[lead.assigned_to] || 0) + 1
    }
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const currentProfile = (profiles ?? []).find((p: Profile) => p.id === user?.id)
  const isAdmin = currentProfile?.role === 'admin'

  return (
    <div className="min-h-screen bg-[#111] p-6">
      <h1 className="text-xl font-semibold text-[#d4d4d8] mb-6">Team</h1>
      <TeamClient
        profiles={(profiles ?? []) as Profile[]}
        leadsPerAgent={leadsPerAgent}
        isAdmin={isAdmin}
      />
    </div>
  )
}
