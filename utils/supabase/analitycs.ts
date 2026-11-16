// utils/analytics.ts
import { createClient } from "@/utils/supabase/client"

export async function getEdadDistribution(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('farmers')
    .select('date_born')
    .not('date_born', 'is', null)

  if (error || !data) return []

  const edadMap = new Map<number, number>()

  data.forEach(farmer => {
    const edad = Math.floor(
      (new Date().getTime() - new Date(farmer.date_born).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    )
    edadMap.set(edad, (edadMap.get(edad) || 0) + 1)
  })

  return Array.from(edadMap.entries())
    .map(([edad, cantidad]) => ({ edad, cantidad_personas: cantidad }))
    .sort((a, b) => a.edad - b.edad)
}

export async function getEdadSexoDistribution(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('farmers')
    .select('date_born, biological_sex')
    .not('date_born', 'is', null)
    .not('biological_sex', 'is', null)

  if (error || !data) return []

  // Agrupar por edad y sexo
  const statsMap = new Map<string, number>()

  data.forEach(farmer => {
    const edad = Math.floor(
      (new Date().getTime() - new Date(farmer.date_born).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    )
    const key = `${edad}-${farmer.biological_sex}`
    statsMap.set(key, (statsMap.get(key) || 0) + 1)
  })

  return Array.from(statsMap.entries())
    .map(([key, cantidad]) => {
      const [edad, sexo] = key.split('-')
      return { edad: parseInt(edad), sexo, cantidad_personas: cantidad }
    })
    .sort((a, b) => a.edad - b.edad || a.sexo.localeCompare(b.sexo))
}