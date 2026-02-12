'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskStatus, BarnRole, Animal } from '@/lib/types'
import { Plus, Check, Clock, Circle, Trash2, X, Calendar, Repeat, PawPrint } from 'lucide-react'

interface TaskListProps {
  barnId: string
  initialTasks: Task[]
  userRole: BarnRole
}

type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly'

const statusConfig = {
  todo: { icon: Circle, color: 'text-chore-todo', bg: 'bg-yellow-50', label: 'To Do' },
  in_progress: { icon: Clock, color: 'text-chore-progress', bg: 'bg-blue-50', label: 'In Progress' },
  done: { icon: Check, color: 'text-chore-done', bg: 'bg-green-50', label: 'Done' },
}

export function TaskList({ barnId, initialTasks, userRole }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [showNewTask, setShowNewTask] = useState(false)
  const [animals, setAnimals] = useState<Animal[]>([])
  const supabase = createClient()

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
    assignedAnimal: '',
    repeat: 'none' as RepeatType,
    section: '',
  })

  const canEdit = userRole !== 'viewer'
  const canDelete = userRole === 'owner' || userRole === 'manager'

  // Load animals for assignment
  useEffect(() => {
    const loadAnimals = async () => {
      const { data } = await supabase
        .from('animals')
        .select('*')
        .eq('barn_id', barnId)
        .order('name')
      if (data) setAnimals(data)
    }
    loadAnimals()
  }, [barnId])

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

  const resetForm = () => {
    setNewTask({
      title: '',
      description: '',
      dueDate: '',
      dueTime: '',
      assignedAnimal: '',
      repeat: 'none',
      section: '',
    })
  }

  const createTask = async () => {
    if (!newTask.title.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Build description with animal and repeat info
    let fullDescription = newTask.description
    if (newTask.assignedAnimal) {
      const animal = animals.find(a => a.id === newTask.assignedAnimal)
      if (animal) {
        fullDescription = `🐾 ${animal.name}${fullDescription ? '\n' + fullDescription : ''}`
      }
    }
    if (newTask.repeat !== 'none') {
      fullDescription = `🔄 Repeats ${newTask.repeat}${fullDescription ? '\n' + fullDescription : ''}`
    }

    const { error } = await supabase
      .from('tasks')
      .insert({
        barn_id: barnId,
        title: newTask.title.trim(),
        description: fullDescription || null,
        due_date: newTask.dueDate || null,
        due_time: newTask.dueTime || null,
        section: newTask.section || null,
        status: 'todo',
        created_by: user.id,
      })

    if (!error) {
      resetForm()
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

      {/* New Task Modal */}
      {showNewTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-stable-800">New Chore</h3>
              <button 
                onClick={() => { setShowNewTask(false); resetForm(); }}
                className="text-stable-400 hover:text-stable-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-stable-700 mb-1">
                  What needs to be done? *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-3 border border-stable-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stable-500"
                  placeholder="e.g., Feed the horses"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-stable-700 mb-1">
                  Details (optional)
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-3 border border-stable-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stable-500"
                  placeholder="Add any additional notes..."
                  rows={2}
                />
              </div>

              {/* Animal Assignment */}
              {animals.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-stable-700 mb-1">
                    <PawPrint size={14} className="inline mr-1" />
                    Assign to Animal
                  </label>
                  <select
                    value={newTask.assignedAnimal}
                    onChange={(e) => setNewTask({ ...newTask, assignedAnimal: e.target.value })}
                    className="w-full px-4 py-3 border border-stable-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stable-500"
                  >
                    <option value="">No specific animal</option>
                    {animals.map(animal => (
                      <option key={animal.id} value={animal.id}>
                        {animal.name} ({animal.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Due Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stable-700 mb-1">
                    <Calendar size={14} className="inline mr-1" />
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-4 py-3 border border-stable-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stable-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stable-700 mb-1">
                    <Clock size={14} className="inline mr-1" />
                    Time
                  </label>
                  <input
                    type="time"
                    value={newTask.dueTime}
                    onChange={(e) => setNewTask({ ...newTask, dueTime: e.target.value })}
                    className="w-full px-4 py-3 border border-stable-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stable-500"
                  />
                </div>
              </div>

              {/* Repeat */}
              <div>
                <label className="block text-sm font-medium text-stable-700 mb-1">
                  <Repeat size={14} className="inline mr-1" />
                  Repeat
                </label>
                <div className="flex gap-2">
                  {(['none', 'daily', 'weekly', 'monthly'] as RepeatType[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setNewTask({ ...newTask, repeat: option })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        newTask.repeat === option
                          ? 'bg-stable-600 text-white'
                          : 'bg-stable-100 text-stable-600 hover:bg-stable-200'
                      }`}
                    >
                      {option === 'none' ? 'Once' : option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section/Category */}
              <div>
                <label className="block text-sm font-medium text-stable-700 mb-1">
                  Category (optional)
                </label>
                <input
                  type="text"
                  value={newTask.section}
                  onChange={(e) => setNewTask({ ...newTask, section: e.target.value })}
                  className="w-full px-4 py-3 border border-stable-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stable-500"
                  placeholder="e.g., Morning, Feeding, Grooming"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={createTask}
                disabled={!newTask.title.trim()}
                className="w-full py-3 bg-stable-600 text-white rounded-xl font-medium hover:bg-stable-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Chore
              </button>
            </div>
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
                    className={`flex items-start gap-3 p-4 rounded-xl ${config.bg} border border-transparent hover:border-stable-200 transition-colors`}
                  >
                    {canEdit && (
                      <button
                        onClick={() => {
                          const nextStatus: TaskStatus =
                            status === 'todo' ? 'in_progress' :
                            status === 'in_progress' ? 'done' : 'todo'
                          updateTaskStatus(task.id, nextStatus)
                        }}
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mt-0.5 ${
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
                    <div className="flex-1 min-w-0">
                      <span className={`block ${status === 'done' ? 'line-through text-stable-400' : 'text-stable-800'}`}>
                        {task.title}
                      </span>
                      {task.description && (
                        <p className="text-sm text-stable-500 mt-1 whitespace-pre-line">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-stable-400">
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                        {task.due_time && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {task.due_time}
                          </span>
                        )}
                        {task.section && (
                          <span className="bg-stable-200 px-2 py-0.5 rounded">
                            {task.section}
                          </span>
                        )}
                      </div>
                    </div>
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
