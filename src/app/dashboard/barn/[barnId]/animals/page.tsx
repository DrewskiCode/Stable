import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AnimalGrid } from '@/components/animals/animal-grid'

export default async function AnimalsPage({ params }: { params: { barnId: string } }) {
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

  // Get animals
  const { data: animals } = await supabase
    .from('animals')
    .select('*')
    .eq('barn_id', params.barnId)
    .order('name', { ascending: true })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stable-800">Animals</h1>
        <p className="text-stable-500">{membership.barn.name}</p>
      </div>

      <AnimalGrid
        barnId={params.barnId}
        initialAnimals={animals || []}
        userRole={membership.role}
      />
    </div>
  )
}
