'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Animal, AnimalMedicalRecord } from '@/lib/types'
import { ArrowLeft, Edit2, Trash2, Plus, Calendar, Weight, Ruler, PawPrint } from 'lucide-react'

export default function AnimalDetailPage({ params }: { params: { barnId: string; animalId: string } }) {
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [medicalRecords, setMedicalRecords] = useState<AnimalMedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showAddMedical, setShowAddMedical] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    breed: '',
    birthdate: '',
    gender: '',
    color: '',
    weight: '',
    height: '',
    notes: '',
  })

  // Medical record form
  const [medicalForm, setMedicalForm] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    details: '',
    veterinarian: '',
    cost: '',
  })

  useEffect(() => {
    loadAnimal()
    loadMedicalRecords()
  }, [params.animalId])

  const loadAnimal = async () => {
    const { data } = await supabase
      .from('animals')
      .select('*')
      .eq('id', params.animalId)
      .single()

    if (data) {
      setAnimal(data)
      setFormData({
        name: data.name,
        type: data.type,
        breed: data.breed || '',
        birthdate: data.birthdate || '',
        gender: data.gender || '',
        color: data.color || '',
        weight: data.weight?.toString() || '',
        height: data.height?.toString() || '',
        notes: data.notes || '',
      })
    }
    setLoading(false)
  }

  const loadMedicalRecords = async () => {
    const { data } = await supabase
      .from('animal_medical_records')
      .select('*')
      .eq('animal_id', params.animalId)
      .order('date', { ascending: false })

    if (data) setMedicalRecords(data)
  }

  const handleUpdate = async () => {
    const { error } = await supabase
      .from('animals')
      .update({
        name: formData.name,
        type: formData.type,
        breed: formData.breed || null,
        birthdate: formData.birthdate || null,
        gender: formData.gender || null,
        color: formData.color || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        notes: formData.notes || null,
      })
      .eq('id', params.animalId)

    if (!error) {
      setEditing(false)
      loadAnimal()
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this animal? This cannot be undone.')) return

    const { error } = await supabase
      .from('animals')
      .delete()
      .eq('id', params.animalId)

    if (!error) {
      router.push(`/dashboard/barn/${params.barnId}/animals`)
    }
  }

  const addMedicalRecord = async () => {
    if (!medicalForm.title.trim()) return

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('animal_medical_records')
      .insert({
        animal_id: params.animalId,
        date: medicalForm.date,
        title: medicalForm.title,
        details: medicalForm.details || null,
        veterinarian: medicalForm.veterinarian || null,
        cost: medicalForm.cost ? parseFloat(medicalForm.cost) : null,
        created_by: user?.id,
      })

    if (!error) {
      setMedicalForm({
        date: new Date().toISOString().split('T')[0],
        title: '',
        details: '',
        veterinarian: '',
        cost: '',
      })
      setShowAddMedical(false)
      loadMedicalRecords()
    }
  }

  const deleteMedicalRecord = async (id: string) => {
    if (!confirm('Delete this medical record?')) return

    await supabase.from('animal_medical_records').delete().eq('id', id)
    loadMedicalRecords()
  }

  const calculateAge = (birthdate: string) => {
    const birth = new Date(birthdate)
    const now = new Date()
    const years = now.getFullYear() - birth.getFullYear()
    const months = now.getMonth() - birth.getMonth()
    if (years === 0) return `${months} months`
    if (months < 0) return `${years - 1} years`
    return `${years} years`
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stable-600"></div>
      </div>
    )
  }

  if (!animal) {
    return (
      <div className="p-6 text-center">
        <p className="text-stable-500">Animal not found</p>
        <Link href={`/dashboard/barn/${params.barnId}/animals`} className="text-stable-600 hover:underline">
          Back to animals
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        href={`/dashboard/barn/${params.barnId}/animals`}
        className="inline-flex items-center text-stable-500 hover:text-stable-700 mb-6"
      >
        <ArrowLeft size={18} className="mr-2" />
        Back to Animals
      </Link>

      {/* Animal Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-start gap-6">
          {animal.photo_url ? (
            <img
              src={animal.photo_url}
              alt={animal.name}
              className="w-32 h-32 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-32 h-32 rounded-2xl bg-stable-100 flex items-center justify-center">
              <PawPrint size={48} className="text-stable-300" />
            </div>
          )}

          <div className="flex-1">
            {editing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-2xl font-bold w-full px-3 py-2 border rounded-lg"
                  placeholder="Name"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                    placeholder="Type (e.g., Horse)"
                  />
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                    placeholder="Breed"
                  />
                  <input
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="">Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="gelding">Gelding</option>
                    <option value="mare">Mare</option>
                    <option value="stallion">Stallion</option>
                  </select>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                    placeholder="Color"
                  />
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                    placeholder="Weight (lbs)"
                  />
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                    placeholder="Height (hands)"
                  />
                </div>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Notes"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-2 bg-stable-600 text-white rounded-lg hover:bg-stable-700"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 text-stable-500 hover:text-stable-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-2xl font-bold text-stable-800">{animal.name}</h1>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(true)}
                      className="p-2 text-stable-400 hover:text-stable-600"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-2 text-stable-400 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-stable-500 mb-4">
                  {animal.breed ? `${animal.breed} ` : ''}{animal.type}
                  {animal.gender && ` • ${animal.gender}`}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {animal.birthdate && (
                    <div className="flex items-center gap-2 text-sm text-stable-600">
                      <Calendar size={16} />
                      <span>{calculateAge(animal.birthdate)}</span>
                    </div>
                  )}
                  {animal.weight && (
                    <div className="flex items-center gap-2 text-sm text-stable-600">
                      <Weight size={16} />
                      <span>{animal.weight} lbs</span>
                    </div>
                  )}
                  {animal.height && (
                    <div className="flex items-center gap-2 text-sm text-stable-600">
                      <Ruler size={16} />
                      <span>{animal.height} hands</span>
                    </div>
                  )}
                  {animal.color && (
                    <div className="flex items-center gap-2 text-sm text-stable-600">
                      <span className="w-4 h-4 rounded-full bg-stable-300"></span>
                      <span>{animal.color}</span>
                    </div>
                  )}
                </div>

                {animal.notes && (
                  <p className="mt-4 text-stable-600 bg-stable-50 p-3 rounded-lg">{animal.notes}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Medical Records */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-stable-800">Medical Records</h2>
          <button
            onClick={() => setShowAddMedical(true)}
            className="flex items-center gap-2 px-4 py-2 bg-stable-600 text-white rounded-xl hover:bg-stable-700"
          >
            <Plus size={18} />
            Add Record
          </button>
        </div>

        {showAddMedical && (
          <div className="bg-stable-50 rounded-xl p-4 mb-6">
            <h3 className="font-medium text-stable-700 mb-4">New Medical Record</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="date"
                value={medicalForm.date}
                onChange={(e) => setMedicalForm({ ...medicalForm, date: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                value={medicalForm.title}
                onChange={(e) => setMedicalForm({ ...medicalForm, title: e.target.value })}
                className="px-3 py-2 border rounded-lg"
                placeholder="Title (e.g., Annual Checkup)"
              />
              <input
                type="text"
                value={medicalForm.veterinarian}
                onChange={(e) => setMedicalForm({ ...medicalForm, veterinarian: e.target.value })}
                className="px-3 py-2 border rounded-lg"
                placeholder="Veterinarian"
              />
              <input
                type="number"
                value={medicalForm.cost}
                onChange={(e) => setMedicalForm({ ...medicalForm, cost: e.target.value })}
                className="px-3 py-2 border rounded-lg"
                placeholder="Cost ($)"
              />
            </div>
            <textarea
              value={medicalForm.details}
              onChange={(e) => setMedicalForm({ ...medicalForm, details: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-4"
              placeholder="Details"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={addMedicalRecord}
                className="px-4 py-2 bg-stable-600 text-white rounded-lg hover:bg-stable-700"
              >
                Save Record
              </button>
              <button
                onClick={() => setShowAddMedical(false)}
                className="px-4 py-2 text-stable-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {medicalRecords.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-stable-100 rounded-xl mb-3">
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-stable-500">No medical records yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {medicalRecords.map((record) => (
              <div key={record.id} className="border border-stable-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm text-stable-400">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                      <h3 className="font-medium text-stable-800">{record.title}</h3>
                    </div>
                    {record.veterinarian && (
                      <p className="text-sm text-stable-500">Dr. {record.veterinarian}</p>
                    )}
                    {record.details && (
                      <p className="text-sm text-stable-600 mt-2">{record.details}</p>
                    )}
                    {record.cost && (
                      <p className="text-sm text-stable-500 mt-2">${record.cost.toFixed(2)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteMedicalRecord(record.id)}
                    className="text-stable-300 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
