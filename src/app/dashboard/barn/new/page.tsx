'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewBarnPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    // Generate a random 6-character join code
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data, error: barnError } = await supabase
      .from('barns')
      .insert({
        name,
        description: description || null,
        join_code: joinCode,
        created_by: user.id,
      })
      .select()
      .single()

    if (barnError) {
      setError(barnError.message)
      setLoading(false)
      return
    }

    // Add the creator as an owner in barn_members
    const { error: memberError } = await supabase
      .from('barn_members')
      .insert({
        barn_id: data.id,
        user_id: user.id,
        role: 'owner',
      })

    if (memberError) {
      console.error('Error adding owner to barn:', memberError)
      // Still navigate since barn was created
    }

    router.push(`/dashboard/barn/${data.id}`)
    router.refresh()
  }

  return (
    <div className="p-8">
      <div className="max-w-lg mx-auto">
        <Link href="/dashboard" className="text-stable-500 hover:text-stable-700 mb-6 inline-block">
          ← Back
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-stable-100 rounded-xl mb-4">
              <span className="text-2xl">🏠</span>
            </div>
            <h1 className="text-2xl font-bold text-stable-800">Create a New Barn</h1>
            <p className="text-stable-500">Set up your ranch workspace</p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-stable-700 mb-1">
                Barn Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-stable-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stable-500"
                placeholder="e.g., Sunny Meadows Ranch"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-stable-700 mb-1">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-stable-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stable-500"
                placeholder="A brief description of your barn..."
                rows={3}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-stable-600 text-white font-semibold rounded-xl hover:bg-stable-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Barn'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
