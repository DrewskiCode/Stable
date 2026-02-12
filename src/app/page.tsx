import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-stable-600 rounded-2xl shadow-lg">
            <span className="text-4xl">🐴</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-bold text-stable-800 mb-4">
          Stable
        </h1>
        <p className="text-xl text-stable-600 mb-8">
          Ranch management made simple. Organize chores, track animals, and keep your team in sync.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white/60 backdrop-blur rounded-xl p-4 shadow-sm">
            <div className="text-2xl mb-2">✅</div>
            <h3 className="font-semibold text-stable-700">Shared Chores</h3>
            <p className="text-sm text-stable-500">No more double-checking. See what's done in real-time.</p>
          </div>
          <div className="bg-white/60 backdrop-blur rounded-xl p-4 shadow-sm">
            <div className="text-2xl mb-2">🐎</div>
            <h3 className="font-semibold text-stable-700">Animal Profiles</h3>
            <p className="text-sm text-stable-500">Medical history, photos, and details in one place.</p>
          </div>
          <div className="bg-white/60 backdrop-blur rounded-xl p-4 shadow-sm">
            <div className="text-2xl mb-2">👥</div>
            <h3 className="font-semibold text-stable-700">Team Sync</h3>
            <p className="text-sm text-stable-500">Invite your crew. Everyone stays on the same page.</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-stable-600 text-white font-semibold rounded-xl shadow-lg hover:bg-stable-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-8 py-3 bg-white text-stable-700 font-semibold rounded-xl shadow-lg border-2 border-stable-200 hover:border-stable-400 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 text-sm text-stable-400">
        Built for ranchers, by ranchers 🌾
      </footer>
    </main>
  )
}
