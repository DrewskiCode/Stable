import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's barns
  const { data: memberships } = await supabase
    .from('barn_members')
    .select('*, barn:barns(*)')
    .eq('user_id', user.id)

  const barns = memberships?.map(m => m.barn) || []

  // If user has barns, redirect to the first one
  if (barns.length > 0) {
    redirect(`/dashboard/barn/${barns[0].id}`)
  }

  // No barns - show onboarding
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-stable-200 rounded-2xl mb-6">
          <span className="text-4xl">🏠</span>
        </div>
        <h1 className="text-3xl font-bold text-stable-800 mb-4">
          Welcome to Stable!
        </h1>
        <p className="text-stable-600 mb-8">
          Create your first barn to get started, or join an existing one with an invite link.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard/barn/new"
            className="px-8 py-3 bg-stable-600 text-white font-semibold rounded-xl shadow-lg hover:bg-stable-700 transition-colors"
          >
            Create a Barn
          </Link>
          <Link
            href="/dashboard/join"
            className="px-8 py-3 bg-white text-stable-700 font-semibold rounded-xl shadow-lg border-2 border-stable-200 hover:border-stable-400 transition-colors"
          >
            Join with Invite
          </Link>
        </div>
      </div>
    </div>
  )
}
