import { createClient } from '@/lib/supabase/server'
import { Lead, ActivityLog, Profile } from '@/lib/types'
import DashboardClient from '@/components/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('*, profiles(*)')

  const { data: activityLogs } = await supabase
    .from('activity_log')
    .select('*, profiles(*)')
    .order('created_at', { ascending: false })
    .limit(20)

  const { count: commentsCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')

  return (
    <div className="min-h-screen bg-[#111] p-6">
      <h1 className="text-xl font-semibold text-[#d4d4d8] mb-6">Dashboard</h1>
      <DashboardClient
        leads={(leads ?? []) as Lead[]}
        activityLogs={(activityLogs ?? []) as ActivityLog[]}
        commentsCount={commentsCount ?? 0}
        profiles={(profiles ?? []) as Profile[]}
      />
    </div>
  )
}
