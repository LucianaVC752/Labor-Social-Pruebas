import { createClient } from "@/utils/supabase/server"
import { getFarmer, getVillages } from "../../actions"
import EditarCampesinoForm from "../editar-campesino-form"
import { redirect } from "next/navigation"

export default async function EditarCampesinoPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params
  const [farmer, villages] = await Promise.all([getFarmer(p.id), getVillages()])
  if (!farmer) {
    redirect("/dashboard/campesino")
  }
  return <EditarCampesinoForm farmer={farmer} villages={villages} />
}
