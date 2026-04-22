import { createClient } from '@/lib/supabase/server'
import { LeadsClient } from '@/components/LeadsClient'
import type { Lead, Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const supabase = await createClient()

  // Fetch leads without heavy profile join - just the lead data
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('id', { ascending: true })

  // Get distinct categories and districts from the data directly
  const allLeads = (leads || []) as Lead[]
  const distinctCategories = [...new Set(allLeads.map(l => l.category).filter(Boolean))].sort()
  const distinctDistricts = [...new Set(allLeads.map(l => l.district).filter(Boolean))].sort()

  const { data: teamProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .order('full_name')

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <LeadsClient
      leads={allLeads}
      categories={distinctCategories}
      districts={distinctDistricts}
      teamProfiles={(teamProfiles as Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>[]) || []}
      currentUserId={user?.id || ''}
    />
  )
}
