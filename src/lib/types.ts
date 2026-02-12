export type BarnRole = 'owner' | 'manager' | 'member' | 'viewer'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Profile {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Barn {
  id: string
  name: string
  description: string | null
  join_code: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface BarnMember {
  id: string
  barn_id: string
  user_id: string
  role: BarnRole
  joined_at: string
  profile?: Profile
}

export interface BarnInvite {
  id: string
  barn_id: string
  email: string
  role: BarnRole
  invited_by: string | null
  token: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export interface Task {
  id: string
  barn_id: string
  title: string
  description: string | null
  section: string | null
  due_date: string | null
  due_time: string | null
  status: TaskStatus
  repeat_type: 'none' | 'daily' | 'weekly' | 'monthly' | null
  assigned_to: string | null
  in_progress_by: string | null
  in_progress_at: string | null
  completed_at: string | null
  completed_by: string | null
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
  assigned_profile?: Profile
  in_progress_profile?: Profile
  completed_profile?: Profile
}

export interface Event {
  id: string
  barn_id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string | null
  all_day: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Animal {
  id: string
  barn_id: string
  name: string
  type: string
  breed: string | null
  birthdate: string | null
  gender: string | null
  color: string | null
  weight: number | null
  height: number | null
  photo_url: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AnimalMedicalRecord {
  id: string
  animal_id: string
  date: string
  title: string
  details: string | null
  veterinarian: string | null
  cost: number | null
  attachments: string[] | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  barn_id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string
  details: Record<string, unknown> | null
  created_at: string
}
