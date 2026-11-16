import { safeReturnPath } from "@/utils/navigation/safe-return"
import { getVillages } from "../actions"
import NuevoCampesinoForm from "./nuevo-campesino-form"

export default async function NuevoCampesinoPage({
  searchParams,
}: {
  searchParams: Promise<{ cc?: string; volverA?: string }>
}) {
  const { cc, volverA } = await searchParams
  const villages = await getVillages()
  // Si viene de registrar una petición: la cédula buscada llega escrita y, al guardar, se vuelve a la captura
  const defaultCc = String(cc ?? "").replace(/\D/g, "").slice(0, 10)
  return <NuevoCampesinoForm villages={villages} defaultCc={defaultCc} returnTo={safeReturnPath(volverA)} />
}
