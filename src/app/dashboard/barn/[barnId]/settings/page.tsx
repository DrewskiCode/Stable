'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Barn, BarnMember, Profile } from '@/lib/types'
import { Settings, Users, Share2, Trash2, LogOut, Crown, UserCog, User, Eye, Copy, Check, RefreshCw } from 'lucide-react'

export default function SettingsPage({ params }: { params: { barnId: string } }) {
  const [barn, setBarn] = useState<Barn | null>(null)
  const [members, setMembers] = useState<(BarnMember & { profile?: Profile })[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<string>('member')
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Barn edit form
  const [barnName, setBarnName] = useState('')
  const [barnDescription, setBarnDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [params.barnId])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load barn
    const { data: barnData } = await supabase
      .from('barns')
      .select('*')
      .eq('id', params.barnId)
      .single()

    if (barnData) {
      setBarn(barnData)
      setBarnName(barnData.name)
      setBarnDescription(barnData.description || '')
    }

    // Load members with profiles
    const { data: membersData, error: membersError } = await supabase
      .from('barn_members')
      .select('*, profile:profiles(*)')
      .eq('barn_id', params.barnId)

    console.log('Members data:', membersData, 'Error:', membersError, 'User ID:', user.id)

    if (membersData) {
      setMembers(membersData)
      const currentMember = membersData.find(m => m.user_id === user.id)
      console.log('Current member found:', currentMember)
      if (currentMember) {
        setCurrentUserRole(currentMember.role)
      } else {
        // Fallback: if user created the barn, they're the owner
        if (barnData && barnData.created_by === user.id) {
          setCurrentUserRole('owner')
        }
      }
    } else {
      // No members data, fallback for owner
      if (barnData && barnData.created_by === user.id) {
        setCurrentUserRole('owner')
      }
    }

    setLoading(false)
  }

  const handleSaveBarn = async () => {
    if (!barnName.trim()) return
    setSaving(true)

    const { error } = await supabase
      .from('barns')
      .update({
        name: barnName,
        description: barnDescription || null,
      })
      .eq('id', params.barnId)

    setSaving(false)
    if (!error) loadData()
  }

  const copyJoinCode = async () => {
    if (barn?.join_code) {
      await navigator.clipboard.writeText(barn.join_code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const regenerateCode = async () => {
    if (!confirm('Generate a new join code? The old code will stop working.')) return
    
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { error } = await supabase
      .from('barns')
      .update({ join_code: newCode })
      .eq('id', params.barnId)
    
    if (!error) loadData()
  }

  const updateMemberRole = async (memberId: string, newRole: string) => {
    await supabase
      .from('barn_members')
      .update({ role: newRole })
      .eq('id', memberId)
    loadData()
  }

  const removeMember = async (memberId: string) => {
    if (!confirm('Remove this member from the barn?')) return
    await supabase.from('barn_members').delete().eq('id', memberId)
    loadData()
  }

  const leaveBarn = async () => {
    if (!confirm('Are you sure you want to leave this barn?')) return

    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('barn_members')
      .delete()
      .eq('barn_id', params.barnId)
      .eq('user_id', user?.id)

    router.push('/dashboard')
  }

  const deleteBarn = async () => {
    if (!confirm('Are you sure you want to DELETE this barn? This action cannot be undone and will remove all data.')) return
    if (!confirm('This will permanently delete all chores, animals, events, and member data. Type "delete" to confirm.')) return

    await supabase.from('barns').delete().eq('id', params.barnId)
    router.push('/dashboard')
  }

  const roleIcons = {
    owner: Crown,
    manager: UserCog,
    member: User,
    viewer: Eye,
  }

  const isOwner = currentUserRole === 'owner'
  const canManage = isOwner || currentUserRole === 'manager'

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stable-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stable-800">Settings</h1>
        <p className="text-stable-500">Manage your barn</p>
      </div>

      {/* Barn Details */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-stable-100 rounded-lg">
            <Settings size={20} className="text-stable-600" />
          </div>
          <h2 className="text-lg font-semibold text-stable-800">Barn Details</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stable-700 mb-1">Barn Name</label>
            <input
              type="text"
              value={barnName}
              onChange={(e) => setBarnName(e.target.value)}
              disabled={!isOwner}
              className="w-full px-4 py-2 border border-stable-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stable-500 disabled:bg-stable-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stable-700 mb-1">Description</label>
            <textarea
              value={barnDescription}
              onChange={(e) => setBarnDescription(e.target.value)}
              disabled={!isOwner}
              className="w-full px-4 py-2 border border-stable-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stable-500 disabled:bg-stable-50"
              rows={3}
            />
          </div>
          {isOwner && (
            <button
              onClick={handleSaveBarn}
              disabled={saving}
              className="px-4 py-2 bg-stable-600 text-white rounded-lg hover:bg-stable-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-stable-100 rounded-lg">
            <Users size={20} className="text-stable-600" />
          </div>
          <h2 className="text-lg font-semibold text-stable-800">Team Members</h2>
        </div>

        <div className="space-y-3">
          {members.map((member) => {
            const RoleIcon = roleIcons[member.role as keyof typeof roleIcons] || User
            const isCurrentUser = member.user_id === barn?.created_by

            return (
              <div key={member.id} className="flex items-center justify-between p-3 bg-stable-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-stable-200 rounded-full flex items-center justify-center">
                    {member.profile?.avatar_url ? (
                      <img src={member.profile.avatar_url} className="w-10 h-10 rounded-full" />
                    ) : (
                      <User size={20} className="text-stable-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-stable-800">
                      {member.profile?.display_name || member.profile?.email || 'Unknown User'}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-stable-500">
                      <RoleIcon size={14} />
                      <span className="capitalize">{member.role}</span>
                    </div>
                  </div>
                </div>

                {isOwner && member.role !== 'owner' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => updateMemberRole(member.id, e.target.value)}
                      className="px-2 py-1 text-sm border rounded-lg"
                    >
                      <option value="manager">Manager</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => removeMember(member.id)}
                      className="p-1 text-stable-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Invite Members - Join Code */}
      {canManage && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-stable-100 rounded-lg">
              <Share2 size={20} className="text-stable-600" />
            </div>
            <h2 className="text-lg font-semibold text-stable-800">Invite Members</h2>
          </div>

          <p className="text-stable-600 mb-4">
            Share this code with people you want to invite to your barn. They can enter it after creating an account.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-stable-100 rounded-xl p-4 text-center">
              <span className="text-3xl font-mono font-bold text-stable-800 tracking-widest">
                {barn?.join_code || '------'}
              </span>
            </div>
            <button
              onClick={copyJoinCode}
              className="p-3 bg-stable-600 text-white rounded-xl hover:bg-stable-700 transition-colors"
              title="Copy code"
            >
              {copiedCode ? <Check size={20} /> : <Copy size={20} />}
            </button>
            {isOwner && (
              <button
                onClick={regenerateCode}
                className="p-3 bg-stable-200 text-stable-600 rounded-xl hover:bg-stable-300 transition-colors"
                title="Generate new code"
              >
                <RefreshCw size={20} />
              </button>
            )}
          </div>

          <p className="text-sm text-stable-500">
            New members will join as <strong>Members</strong> by default. You can change their role below after they join.
          </p>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-red-200">
        <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
        <div className="space-y-3">
          {!isOwner && (
            <button
              onClick={leaveBarn}
              className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
            >
              <LogOut size={18} />
              Leave Barn
            </button>
          )}
          {isOwner && (
            <button
              onClick={deleteBarn}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 size={18} />
              Delete Barn
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
