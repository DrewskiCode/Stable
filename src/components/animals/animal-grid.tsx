'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Animal, BarnRole } from '@/lib/types'
import { Plus, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface AnimalGridProps {
  barnId: string
  initialAnimals: Animal[]
  userRole: BarnRole
}

const animalEmojis: Record<string, string> = {
  horse: '🐴',
  cat: '🐱',
  dog: '🐕',
  cow: '🐄',
  sheep: '🐑',
  goat: '🐐',
  pig: '🐷',
  chicken: '🐔',
  duck: '🦆',
  rabbit: '🐰',
  default: '🐾',
}

export function AnimalGrid({ barnId, initialAnimals, userRole }: AnimalGridProps) {
  const [animals, setAnimals] = useState<Animal[]>(initialAnimals)
  const [showNewAnimal, setShowNewAnimal] = useState(false)
  const [newAnimal, setNewAnimal] = useState({ name: '', type: 'horse', breed: '' })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const canEdit = userRole !== 'viewer'

  const createAnimal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAnimal.name.trim()) return

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('animals')
      .insert({
        barn_id: barnId,
        name: newAnimal.name.trim(),
        type: newAnimal.type,
        breed: newAnimal.breed || null,
        created_by: user?.id,
      })
      .select()
      .single()

    if (!error && data) {
      setAnimals(prev => [...prev, data])
      setNewAnimal({ name: '', type: 'horse', breed: '' })
      setShowNewAnimal(false)
    }
    setLoading(false)
  }

  return (
    <div>
      {/* Add Animal Button */}
      {canEdit && (
        <button
          onClick={() => setShowNewAnimal(true)}
          className="flex items-center gap-2 px-4 py-2 mb-6 bg-stable-600 text-white rounded-xl hover:bg-stable-700 transition-colors"
        >
          <Plus size={18} />
          Add Animal
        </button>
      )}

      {/* New Animal Modal */}
      {showNewAnimal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewAnimal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-stable-800">Add New Animal</h2>
              <button onClick={() => setShowNewAnimal(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={createAnimal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stable-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newAnimal.name}
                  onChange={(e) => setNewAnimal(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-stable-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stable-500"
                  placeholder="e.g., Wilco"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stable-700 mb-1">Type *</label>
                <select
                  value={newAnimal.type}
                  onChange={(e) => setNewAnimal(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-3 border border-stable-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stable-500"
                >
                  <option value="horse">🐴 Horse</option>
                  <option value="cat">🐱 Cat</option>
                  <option value="dog">🐕 Dog</option>
                  <option value="cow">🐄 Cow</option>
                  <option value="sheep">🐑 Sheep</option>
                  <option value="goat">🐐 Goat</option>
                  <option value="pig">🐷 Pig</option>
                  <option value="chicken">🐔 Chicken</option>
                  <option value="duck">🦆 Duck</option>
                  <option value="rabbit">🐰 Rabbit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stable-700 mb-1">Breed</label>
                <input
                  type="text"
                  value={newAnimal.breed}
                  onChange={(e) => setNewAnimal(prev => ({ ...prev, breed: e.target.value }))}
                  className="w-full px-4 py-3 border border-stable-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stable-500"
                  placeholder="e.g., Quarter Horse"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-stable-600 text-white font-semibold rounded-xl hover:bg-stable-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Animal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Animal Grid */}
      {animals.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-stable-100 rounded-2xl mb-4">
            <span className="text-3xl">🐾</span>
          </div>
          <h3 className="text-lg font-semibold text-stable-700 mb-2">No animals yet</h3>
          <p className="text-stable-500">Add your first animal to start tracking!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {animals.map((animal) => (
            <Link
              key={animal.id}
              href={`/dashboard/barn/${barnId}/animals/${animal.id}`}
              className="bg-white rounded-2xl p-4 shadow-sm border border-stable-100 hover:shadow-md hover:border-stable-200 transition-all"
            >
              <div className="aspect-square bg-stable-100 rounded-xl flex items-center justify-center mb-3 overflow-hidden">
                {animal.photo_url ? (
                  <Image
                    src={animal.photo_url}
                    alt={animal.name}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl">
                    {animalEmojis[animal.type] || animalEmojis.default}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-stable-800 truncate">{animal.name}</h3>
              <p className="text-sm text-stable-500 capitalize">{animal.type}</p>
              {animal.breed && (
                <p className="text-xs text-stable-400 truncate">{animal.breed}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
