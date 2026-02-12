import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TaskList } from '@/components/tasks/task-list'

export default async function BarnChoresPage({ params }: { params: { barnId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify user is a member of this barn
  const { data: membership } = await supabase
    .from('barn_members')
    .select('*, barn:barns(*)')
    .eq('barn_id', params.barnId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    notFound()
  }

  // Get today's tasks
  const today = new Date().toISOString().split('T')[0]
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, assigned_profile:profiles!tasks_assigned_to_fkey(*)')
    .eq('barn_id', params.barnId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stable-800">{membership.barn.name}</h1>
        <p className="text-stable-500">Today's Chores</p>
      </div>

      <TaskList
        barnId={params.barnId}
        initialTasks={tasks || []}
        userRole={membership.role}
      />
    </div>
  )
}
