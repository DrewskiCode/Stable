'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function JoinBarnPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const cleanCode = code.trim().toUpperCase()
    if (cleanCode.length < 4) {
      setError('Please enter a valid join code')
      setLoading(false)
      return
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    // Find barn by join code
    const { data: barn, error: barnError } = await supabase
      .from('barns')
      .select('id, name')
      .eq('join_code', cleanCode)
      .single()

    if (barnError || !barn) {
      setError('Invalid join code. Please check and try again.')
      setLoading(false)
      return
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('barn_members')
      .select('id')
      .eq('barn_id', barn.id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      // Already a member, just redirect
      router.push(`/dashboard/barn/${barn.id}`)
      return
    }

    // Join the barn as a member
    const { error: joinError } = await supabase
      .from('barn_members')
      .insert({
        barn_id: barn.id,
        user_id: user.id,
        role: 'member',
      })

    if (joinError) {
      setError('Could not join barn. Please try again.')
      setLoading(false)
      return
    }

    // Success! Redirect to the barn
    router.push(`/dashboard/barn/${barn.id}`)
    router.refresh()
  }

  return (
    <div className="p-8">
      <div className="max-w-md mx-auto">
        <Link href="/dashboard" className="text-stable-500 hover:text-stable-700 mb-6 inline-block">
          ← Back
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-stable-100 rounded-xl mb-4">
              <span className="text-2xl">🤝</span>
            </div>
            <h1 className="text-2xl font-bold text-stable-800">Join a Barn</h1>
            <p className="text-stable-500">Enter the code shared by the barn owner</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stable-700 mb-2">
                Join Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-4 text-center text-2xl font-mono font-bold tracking-widest border border-stable-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stable-500 uppercase"
                placeholder="ABC123"
                maxLength={8}
                autoComplete="off"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-3 bg-stable-600 text-white font-semibold rounded-xl hover:bg-stable-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Join Barn'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stable-200 text-center">
            <p className="text-sm text-stable-500">
              Don't have a code?{' '}
              <Link href="/dashboard/barn/new" className="text-stable-600 hover:underline font-medium">
                Create your own barn
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
