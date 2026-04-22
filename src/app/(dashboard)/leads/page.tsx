import { createClient } from '@/lib/supabase/server'
import { LeadsClient } from '@/components/LeadsClient'
import type { Lead, Profile } from '@/lib/types'

export default async function LeadsPage() {
  const supabase = await createClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('*, profiles(*)')
    .order('created_at', { ascending: false })

  const { data: categories } = await supabase
    .from('leads')
    .select('category')

  const { data: districts } = await supabase
    .from('leads')
    .select('district')

  const { data: teamProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .order('full_name')

  const { data: { user } } = await supabase.auth.getUser()

  const distinctCategories = [...new Set((categories || []).map(c => c.category).filter(Boolean))]
  const distinctDistricts = [...new Set((districts || []).map(d => d.district).filter(Boolean))]

  return (
    <LeadsClient
      leads={(leads as Lead[]) || []}
      categories={distinctCategories}
      districts={distinctDistricts}
      teamProfiles={(teamProfiles as Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>[]) || []}
      currentUserId={user?.id || ''}
    />
  )
}
