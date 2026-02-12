'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/lib/types'
import { ChevronLeft, ChevronRight, Plus, X, Clock, Trash2 } from 'lucide-react'

export default function CalendarPage({ params }: { params: { barnId: string } }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const supabase = createClient()

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    allDay: false,
  })

  useEffect(() => {
    loadEvents()
  }, [currentDate])

  const loadEvents = async () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)

    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('barn_id', params.barnId)
      .gte('starts_at', startOfMonth.toISOString())
      .lte('starts_at', endOfMonth.toISOString())
      .order('starts_at', { ascending: true })

    if (data) setEvents(data)
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (Date | null)[] = []

    // Add empty slots for days before the first
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.starts_at)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const handleAddEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.date) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let startsAt: string
    let endsAt: string | null = null

    if (eventForm.allDay) {
      startsAt = new Date(`${eventForm.date}T00:00:00`).toISOString()
    } else {
      startsAt = new Date(`${eventForm.date}T${eventForm.startTime || '09:00'}`).toISOString()
      if (eventForm.endTime) {
        endsAt = new Date(`${eventForm.date}T${eventForm.endTime}`).toISOString()
      }
    }

    const { error } = await supabase
      .from('events')
      .insert({
        barn_id: params.barnId,
        title: eventForm.title,
        description: eventForm.description || null,
        starts_at: startsAt,
        ends_at: endsAt,
        all_day: eventForm.allDay,
        created_by: user.id,
      })

    if (!error) {
      setEventForm({ title: '', description: '', date: '', startTime: '', endTime: '', allDay: false })
      setShowAddEvent(false)
      setSelectedDate(null)
      loadEvents()
    }
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return
    await supabase.from('events').delete().eq('id', id)
    loadEvents()
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const today = new Date()
  const days = getDaysInMonth()

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stable-800">Calendar</h1>
        <button
          onClick={() => {
            setEventForm({ ...eventForm, date: new Date().toISOString().split('T')[0] })
            setShowAddEvent(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-stable-600 text-white rounded-xl hover:bg-stable-700"
        >
          <Plus size={18} />
          Add Event
        </button>
      </div>

      {/* Calendar Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2 hover:bg-stable-100 rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold text-stable-800">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2 hover:bg-stable-100 rounded-lg"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-stable-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="h-24 bg-stable-50 rounded-lg"></div>
            }

            const dayEvents = getEventsForDate(day)
            const isToday = day.toDateString() === today.toDateString()
            const isSelected = selectedDate?.toDateString() === day.toDateString()

            return (
              <div
                key={day.toISOString()}
                onClick={() => {
                  setSelectedDate(day)
                  setEventForm({ ...eventForm, date: day.toISOString().split('T')[0] })
                }}
                className={`h-24 p-2 rounded-lg cursor-pointer transition-colors overflow-hidden ${
                  isToday ? 'bg-stable-100 border-2 border-stable-400' :
                  isSelected ? 'bg-stable-200' :
                  'bg-stable-50 hover:bg-stable-100'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-stable-700' : 'text-stable-600'}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className="text-xs bg-stable-600 text-white px-1 py-0.5 rounded truncate"
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-stable-500">+{dayEvents.length - 2} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-stable-800">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <button
              onClick={() => setShowAddEvent(true)}
              className="text-stable-600 hover:text-stable-800"
            >
              <Plus size={20} />
            </button>
          </div>

          {getEventsForDate(selectedDate).length === 0 ? (
            <p className="text-stable-500 text-center py-4">No events on this day</p>
          ) : (
            <div className="space-y-3">
              {getEventsForDate(selectedDate).map(event => (
                <div key={event.id} className="flex items-start justify-between p-3 bg-stable-50 rounded-xl">
                  <div>
                    <h4 className="font-medium text-stable-800">{event.title}</h4>
                    {!event.all_day && (
                      <div className="flex items-center gap-1 text-sm text-stable-500 mt-1">
                        <Clock size={14} />
                        {new Date(event.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {event.ends_at && ` - ${new Date(event.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </div>
                    )}
                    {event.all_day && (
                      <span className="text-xs bg-stable-200 text-stable-600 px-2 py-0.5 rounded mt-1 inline-block">
                        All Day
                      </span>
                    )}
                    {event.description && (
                      <p className="text-sm text-stable-600 mt-2">{event.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="text-stable-300 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-stable-800">Add Event</h3>
              <button onClick={() => setShowAddEvent(false)} className="text-stable-400 hover:text-stable-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stable-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-stable-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stable-500"
                  placeholder="Event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stable-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-stable-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stable-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={eventForm.allDay}
                  onChange={(e) => setEventForm({ ...eventForm, allDay: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="allDay" className="text-sm text-stable-700">All day event</label>
              </div>

              {!eventForm.allDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stable-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={eventForm.startTime}
                      onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                      className="w-full px-4 py-2 border border-stable-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stable-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stable-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={eventForm.endTime}
                      onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-stable-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stable-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-stable-700 mb-1">Description</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-stable-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stable-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <button
                onClick={handleAddEvent}
                className="w-full py-3 bg-stable-600 text-white rounded-xl font-medium hover:bg-stable-700"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
