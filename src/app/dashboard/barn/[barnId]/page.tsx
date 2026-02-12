import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TaskList } from '@/components/tasks/task-list'

export const dynamic = 'force-dynamic'

export default async function BarnChoresPage({ params }: { params: { barnId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify user is a member of this barn
  const { data: membership, error: memberError } = await supabase
    .from('barn_members')
    .select('*, barn:barns(*)')
    .eq('barn_id', params.barnId)
    .eq('user_id', user.id)
    .single()

  if (memberError) {
    console.error('Membership error:', memberError)
  }

  if (!membership) {
    notFound()
  }

  // Get tasks - simplified query without the problematic join
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('barn_id', params.barnId)
    .order('created_at', { ascending: false })

  if (tasksError) {
    console.error('Tasks error:', tasksError)
  }

  console.log('Loaded tasks:', tasks?.length, 'for barn:', params.barnId)

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
