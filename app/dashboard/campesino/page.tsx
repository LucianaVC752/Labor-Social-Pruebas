import { createClient } from '@/utils/supabase/server'
import { columns } from './column'
import { DataTable } from '@/components/data-table'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getCampesinos } from '@/utils/supabase/server'



type PageProps = {
  searchParams: Promise<{ search?: string }>  
}

export default async function CampesinosPage({ searchParams }: PageProps) {
  const params = await searchParams  // ⭐ Await aquí
  const data = await getCampesinos(params.search)

  return (
    <section className="py-8">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-neutral-800">Campesinos Registrados</h1>
          <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
            <Link href="/dashboard/campesino/nuevo">Crear Campesino</Link>
          </Button>
        </div>
        <DataTable columns={columns} data={data} />
      </div>
    </section>
  )
}

