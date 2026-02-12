import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard/nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  const barns = memberships?.map(m => m.barn).filter(Boolean) || []

  return (
    <div className="min-h-screen bg-stable-50">
      <DashboardNav user={user} barns={barns} />
      <main className="pb-20 md:pb-0 md:ml-64">
        {children}
      </main>
    </div>
  )
}
