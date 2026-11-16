import { getFarmer } from "../../actions"
import { redirect } from "next/navigation"
import VerCampesinoForm from "../ver-campesino-form"

export default async function VistaCampesinoPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params
  const farmer = await getFarmer(p.id)
  if (!farmer) redirect("/dashboard/campesino")
  return <VerCampesinoForm farmer={farmer} />
}
