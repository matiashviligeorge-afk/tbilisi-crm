export type Status = 'new' | 'contacted' | 'follow-up' | 'proposal' | 'won' | 'lost'
export type Priority = 'low' | 'medium' | 'high'

export type Profile = {
  id: string
  email: string
  full_name: string
  role: string
  avatar_url: string | null
  created_at: string
}

export type Lead = {
  id: number
  name: string
  category: string
  district: string
  address: string
  phone: string
  source: string
  status: Status
  priority: Priority
  assigned_to: string | null
  contact_person: string
  contact_email: string
  last_contact: string | null
  website_url: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
}

export type Comment = {
  id: number
  lead_id: number
  user_id: string
  text: string
  created_at: string
  profiles?: Profile
}

export type ActivityLog = {
  id: number
  lead_id: number
  user_id: string
  action: string
  old_value: string | null
  new_value: string | null
  created_at: string
  profiles?: Profile
}
