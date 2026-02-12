'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskStatus, BarnRole } from '@/lib/types'
import { Plus, Check, Clock, Circle, Trash2 } from 'lucide-react'

interface TaskListProps {
  barnId: string
  initialTasks: Task[]
  userRole: BarnRole
}

const statusConfig = {
  todo: { icon: Circle, color: 'text-chore-todo', bg: 'bg-yellow-50', label: 'To Do' },
  in_progress: { icon: Clock, color: 'text-chore-progress', bg: 'bg-blue-50', label: 'In Progress' },
  done: { icon: Check, color: 'text-chore-done', bg: 'bg-green-50', label: 'Done' },
}

export function TaskList({ barnId, initialTasks, userRole }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showNewTask, setShowNewTask] = useState(false)
  const supabase = createClient()

  const canEdit = userRole !== 'viewer'
  const canDelete = userRole === 'owner' || userRole === 'manager'

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`tasks-${barnId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `barn_id=eq.${barnId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [...prev, payload.new as Task])
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as Task : t))
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [barnId, supabase])

  const createTask = async () => {
    if (!newTaskTitle.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('tasks')
      .insert({
        barn_id: barnId,
        title: newTaskTitle.trim(),
        status: 'todo',
        created_by: user.id,
      })

    if (!error) {
      setNewTaskTitle('')
      setShowNewTask(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    const updates: Partial<Task> = { status: newStatus }
    if (newStatus === 'done') {
      updates.completed_at = new Date().toISOString()
      updates.completed_by = user?.id
    } else {
      updates.completed_at = null
      updates.completed_by = null
    }

    await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
  }

  const deleteTask = async (taskId: string) => {
    await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
  }

  const completeAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const incompleteTasks = tasks.filter(t => t.status !== 'done')
    
    for (const task of incompleteTasks) {
      await supabase
        .from('tasks')
        .update({
          status: 'done',
          completed_at: new Date().toISOString(),
          completed_by: user?.id,
        })
        .eq('id', task.id)
    }
  }

  const groupedTasks = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      {canEdit && (
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewTask(true)}
            className="flex items-center gap-2 px-4 py-2 bg-stable-600 text-white rounded-xl hover:bg-stable-700 transition-colors"
          >
            <Plus size={18} />
            New Chore
          </button>
          {tasks.some(t => t.status !== 'done') && (
            <button
              onClick={completeAll}
              className="flex items-center gap-2 px-4 py-2 bg-chore-done text-white rounded-xl hover:bg-green-600 transition-colors"
            >
              <Check size={18} />
              Complete All
            </button>
          )}
        </div>
      )}

      {/* New Task Input */}
      {showNewTask && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stable-200">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createTask()}
            placeholder="What needs to be done?"
            className="w-full px-4 py-3 border border-stable-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stable-500"
            autoFocus
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={createTask}
              className="px-4 py-2 bg-stable-600 text-white rounded-lg hover:bg-stable-700"
            >
              Add Chore
            </button>
            <button
              onClick={() => setShowNewTask(false)}
              className="px-4 py-2 text-stable-500 hover:text-stable-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Task Lists by Status */}
      {(['todo', 'in_progress', 'done'] as const).map((status) => {
        const config = statusConfig[status]
        const StatusIcon = config.icon
        const statusTasks = groupedTasks[status]

        if (statusTasks.length === 0 && status === 'done') return null

        return (
          <div key={status}>
            <h3 className={`text-sm font-semibold uppercase tracking-wider ${config.color} mb-3`}>
              {config.label} ({statusTasks.length})
            </h3>
            <div className="space-y-2">
              {statusTasks.length === 0 ? (
                <p className="text-stable-400 text-sm py-4">No chores here</p>
              ) : (
                statusTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-4 rounded-xl ${config.bg} border border-transparent hover:border-stable-200 transition-colors`}
                  >
                    {canEdit && (
                      <button
                        onClick={() => {
                          const nextStatus: TaskStatus =
                            status === 'todo' ? 'in_progress' :
                            status === 'in_progress' ? 'done' : 'todo'
                          updateTaskStatus(task.id, nextStatus)
                        }}
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          status === 'done'
                            ? 'bg-chore-done border-chore-done text-white'
                            : status === 'in_progress'
                            ? 'border-chore-progress text-chore-progress'
                            : 'border-stable-300 hover:border-chore-todo'
                        }`}
                      >
                        {status === 'done' && <Check size={14} />}
                        {status === 'in_progress' && <Clock size={14} />}
                      </button>
                    )}
                    <span className={`flex-1 ${status === 'done' ? 'line-through text-stable-400' : 'text-stable-800'}`}>
                      {task.title}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-stable-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}

      {tasks.length === 0 && !showNewTask && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-stable-100 rounded-2xl mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h3 className="text-lg font-semibold text-stable-700 mb-2">No chores yet</h3>
          <p className="text-stable-500">Add your first chore to get started!</p>
        </div>
      )}
    </div>
  )
}
