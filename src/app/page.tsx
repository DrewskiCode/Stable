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
    <main className="min-h-screen flex flex-col items-center justify-center p-8 texture-overlay">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-stable-600/5 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-stable-700/5 to-transparent" />
      
      <div className="max-w-2xl text-center relative z-10">
        {/* Logo */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-stable-500 to-stable-700 rounded-2xl shadow-xl shadow-stable-600/20 border-2 border-stable-400/20">
            <span className="text-5xl">🐴</span>
          </div>
        </div>

        {/* Decorative line */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-stable-400/50" />
          <span className="text-stable-400 text-lg">✦</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-stable-400/50" />
        </div>

        {/* Headline with western font */}
        <h1 className="text-6xl md:text-7xl font-western font-bold text-stable-800 mb-3 tracking-wide">
          Stable
        </h1>
        <p className="text-lg md:text-xl text-stable-600 mb-10 max-w-md mx-auto leading-relaxed">
          Ranch management made simple. Organize chores, track animals, and keep your team in sync.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="group bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-stable-200/50 hover:shadow-md hover:border-stable-300/50 transition-all duration-300">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">✅</div>
            <h3 className="font-semibold text-stable-700 mb-1">Shared Chores</h3>
            <p className="text-sm text-stable-500">No more double-checking. See what&apos;s done in real-time.</p>
          </div>
          <div className="group bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-stable-200/50 hover:shadow-md hover:border-stable-300/50 transition-all duration-300">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🐎</div>
            <h3 className="font-semibold text-stable-700 mb-1">Animal Profiles</h3>
            <p className="text-sm text-stable-500">Medical history, photos, and details in one place.</p>
          </div>
          <div className="group bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-stable-200/50 hover:shadow-md hover:border-stable-300/50 transition-all duration-300">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">👥</div>
            <h3 className="font-semibold text-stable-700 mb-1">Team Sync</h3>
            <p className="text-sm text-stable-500">Invite your crew. Everyone stays on the same page.</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-10 py-3.5 bg-gradient-to-r from-stable-600 to-stable-700 text-white font-semibold rounded-xl shadow-lg shadow-stable-600/25 hover:shadow-xl hover:shadow-stable-600/30 hover:-translate-y-0.5 transition-all duration-300"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-10 py-3.5 bg-white/80 text-stable-700 font-semibold rounded-xl shadow-md border-2 border-stable-200 hover:border-stable-400 hover:bg-white hover:-translate-y-0.5 transition-all duration-300"
          >
            Create Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-sm text-stable-400 font-medium">
        <span className="opacity-75">Prototype made for</span> <span className="text-stable-500">Sammy</span><span className="opacity-75">, by</span> <span className="text-stable-500">Drew</span> <span className="ml-1">🤍</span>
      </footer>
    </main>
  )
}
