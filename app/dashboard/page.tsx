import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import AgeCharts from '@/components/ui/AgeCharts'
import getUserId from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const userEmail = data.user?.email ?? 'Usuario'
  let userId: string | null = null
  try {
    userId = await getUserId()
  } catch {
    userId = null
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Panel de Control</h1>
        <div className="flex gap-6 flex-wrap">
          <Link href="/dashboard/campesino" className="text-xl text-secondary">Ver campesinos</Link>
          <Link href="/dashboard/formularios" className="text-xl text-secondary">Formularios</Link>
          <Link href="/dashboard/peticiones/nueva" className="text-xl text-secondary">Registrar petición</Link>
        </div>
        <p className="text-sm text-neutral-600">Bienvenido, {userEmail}</p>
      </header>

      <AgeCharts userId={userId ?? ''} />
    </div>
  )
}