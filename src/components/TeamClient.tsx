'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'

interface Props {
  profiles: Profile[]
  leadsPerAgent: Record<string, number>
  isAdmin: boolean
}

export default function TeamClient({ profiles, leadsPerAgent, isAdmin }: Props) {
  const router = useRouter()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showInvite, setShowInvite] = useState(false)

  async function handleRoleChange(profileId: string, newRole: string) {
    setUpdatingId(profileId)
    const supabase = createClient()
    await supabase.from('profiles').update({ role: newRole }).eq('id', profileId)
    setUpdatingId(null)
    router.refresh()
  }

  const registerUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/register`
      : '/register'

  return (
    <div className="space-y-6">
      {/* Invite section */}
      {isAdmin && (
        <div className="rounded-lg border border-[#2c2c30] bg-[#19191d] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-[#d4d4d8]">Invite Team Member</h2>
              <p className="text-[12px] text-[#71717a] mt-0.5">
                Share the registration link with new team members
              </p>
            </div>
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="px-3 py-1.5 text-sm bg-[#3b82f6] text-white rounded-md hover:bg-[#2563eb] transition-colors"
            >
              {showInvite ? 'Hide' : 'Show Link'}
            </button>
          </div>
          {showInvite && (
            <div className="mt-3 flex gap-2">
              <input
                readOnly
                value={registerUrl}
                className="flex-1 px-3 py-2 bg-[#222226] border border-[#2c2c30] rounded-md text-sm text-[#d4d4d8] outline-none"
              />
              <button
                onClick={() => navigator.clipboard.writeText(registerUrl)}
                className="px-3 py-2 text-sm text-[#d4d4d8] bg-[#222226] border border-[#2c2c30] rounded-md hover:border-[#3b82f6] transition-colors"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      )}

      {/* Team table */}
      <div className="rounded-lg border border-[#2c2c30] bg-[#19191d] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2c2c30] bg-[#222226]">
                <th className="text-left py-3 px-4 text-[12px] font-medium text-[#71717a]">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-[12px] font-medium text-[#71717a]">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-[12px] font-medium text-[#71717a]">
                  Role
                </th>
                <th className="text-right py-3 px-4 text-[12px] font-medium text-[#71717a]">
                  Leads Assigned
                </th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr
                  key={profile.id}
                  className="border-b border-[#2c2c30] last:border-0"
                >
                  <td className="py-3 px-4 text-[#d4d4d8]">
                    {profile.full_name || 'Unnamed'}
                  </td>
                  <td className="py-3 px-4 text-[#71717a]">{profile.email}</td>
                  <td className="py-3 px-4">
                    {isAdmin ? (
                      <select
                        value={profile.role}
                        onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                        disabled={updatingId === profile.id}
                        className="bg-[#222226] border border-[#2c2c30] rounded px-2 py-1 text-sm text-[#d4d4d8] outline-none focus:border-[#3b82f6] disabled:opacity-50 transition-colors"
                      >
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className="text-[12px] px-2 py-0.5 rounded bg-[#222226] text-[#d4d4d8] capitalize">
                        {profile.role}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-[#d4d4d8]">
                    {leadsPerAgent[profile.id] ?? 0}
                  </td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-[#71717a]">
                    No team members yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
