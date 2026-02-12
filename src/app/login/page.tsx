'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      console.log('Login error:', error)
      setError(error.message)
      setLoading(false)
    } else if (data.user) {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for the magic link!')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link href="/" className="text-stable-500 hover:text-stable-700 mb-8 inline-block">
          ← Back to home
        </Link>

        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-stable-600 rounded-xl mb-4">
              <span className="text-2xl">🐴</span>
            </div>
            <h1 className="text-2xl font-bold text-stable-800">Welcome back</h1>
            <p className="text-stable-500">Sign in to your Stable account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stable-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-stable-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stable-500"
                placeholder="you@ranch.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stable-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-stable-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stable-500"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-stable-600 text-white font-semibold rounded-xl hover:bg-stable-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4">
            <button
              onClick={handleMagicLink}
              disabled={loading}
              className="w-full py-3 bg-stable-100 text-stable-700 font-semibold rounded-xl hover:bg-stable-200 transition-colors disabled:opacity-50"
            >
              Send Magic Link
            </button>
          </div>

          <p className="text-center mt-6 text-stable-500">
            Don't have an account?{' '}
            <Link href="/signup" className="text-stable-700 font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
