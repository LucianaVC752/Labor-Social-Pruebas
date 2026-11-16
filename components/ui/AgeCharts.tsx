"use client"
import { useEffect, useState } from 'react'
import Grid from '@/components/ui/Grid'
import PanelCard from '@/components/ui/PanelCard'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { createClient } from '@/utils/supabase/client'
import { getEdadDistribution, getEdadSexoDistribution } from '@/utils/supabase/analitycs'

type EdadTotal = { rango: string; total: number }
type EdadSexo = { rango: string; masculino: number; femenino: number }

function rangoEdad(edad: number): string {
  if (edad <= 17) return '0–17'
  if (edad <= 25) return '18–25'
  if (edad <= 35) return '26–35'
  if (edad <= 45) return '36–45'
  if (edad <= 60) return '46–60'
  return '60+'
}

export default function AgeCharts({ userId }: { userId: string }) {
  const [edadTotalData, setEdadTotalData] = useState<EdadTotal[]>([])
  const [edadSexoData, setEdadSexoData] = useState<EdadSexo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      if (!userId) return

      const [byEdad, byEdadSexo] = await Promise.all([
        getEdadDistribution(userId),
        getEdadSexoDistribution(userId),
      ])

      const totalMap = new Map<string, number>()
      byEdad.forEach((row: { edad: number; cantidad_personas: number }) => {
        const r = rangoEdad(row.edad)
        totalMap.set(r, (totalMap.get(r) || 0) + row.cantidad_personas)
      })
      const totalData: EdadTotal[] = [
        { rango: '0–17', total: totalMap.get('0–17') || 0 },
        { rango: '18–25', total: totalMap.get('18–25') || 0 },
        { rango: '26–35', total: totalMap.get('26–35') || 0 },
        { rango: '36–45', total: totalMap.get('36–45') || 0 },
        { rango: '46–60', total: totalMap.get('46–60') || 0 },
        { rango: '60+', total: totalMap.get('60+') || 0 },
      ]

      const sexoMap = new Map<string, { M: number; F: number }>()
      byEdadSexo.forEach(
        (row: { edad: number; sexo: string; cantidad_personas: number }) => {
          const r = rangoEdad(row.edad)
          const curr = sexoMap.get(r) || { M: 0, F: 0 }
          if (row.sexo === 'M') curr.M += row.cantidad_personas
          else if (row.sexo === 'F') curr.F += row.cantidad_personas
          sexoMap.set(r, curr)
        }
      )
      const sexoData: EdadSexo[] = [
        { rango: '0–17', masculino: (sexoMap.get('0–17')?.M || 0), femenino: (sexoMap.get('0–17')?.F || 0) },
        { rango: '18–25', masculino: (sexoMap.get('18–25')?.M || 0), femenino: (sexoMap.get('18–25')?.F || 0) },
        { rango: '26–35', masculino: (sexoMap.get('26–35')?.M || 0), femenino: (sexoMap.get('26–35')?.F || 0) },
        { rango: '36–45', masculino: (sexoMap.get('36–45')?.M || 0), femenino: (sexoMap.get('36–45')?.F || 0) },
        { rango: '46–60', masculino: (sexoMap.get('46–60')?.M || 0), femenino: (sexoMap.get('46–60')?.F || 0) },
        { rango: '60+', masculino: (sexoMap.get('60+')?.M || 0), femenino: (sexoMap.get('60+')?.F || 0) },
      ]

      setEdadTotalData(totalData)
      setEdadSexoData(sexoData)
      setLoading(false)
    }

    run()
  }, [userId])

  const chartConfigTotal = {
    total: { label: 'Total', color: 'rgb(104 142 38)' },
  }

  const chartConfigSexo = {
    masculino: { label: 'Masculino', color: 'rgb(63 136 197)' },
    femenino: { label: 'Femenino', color: 'rgb(22 48 70)' },
  }

  return (
    <Grid cols={2} gap="gap-5" className="auto-rows-fr">
      <PanelCard title="Distribución por Rango de Edad" subtitle="General">
        {loading ? (
          <div className="min-h-[280px] w-full animate-pulse bg-neutral-100 rounded-md" />
        ) : edadTotalData.every(d => d.total === 0) ? (
          <div className="min-h-[280px] w-full flex items-center justify-center text-sm text-neutral-600">
            Sin datos para el usuario
          </div>
        ) : (
          <ChartContainer config={chartConfigTotal} className="min-h-[280px] w-full">
            <BarChart accessibilityLayer data={edadTotalData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="rango" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Bar dataKey="total" fill="var(--color-total)" radius={4} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
        )}
      </PanelCard>

      <PanelCard title="Distribución por Rango de Edad" subtitle="Por sexo">
        {loading ? (
          <div className="min-h-[280px] w-full animate-pulse bg-neutral-100 rounded-md" />
        ) : edadSexoData.every(d => d.masculino === 0 && d.femenino === 0) ? (
          <div className="min-h-[280px] w-full flex items-center justify-center text-sm text-neutral-600">
            Sin datos por sexo para el usuario
          </div>
        ) : (
          <ChartContainer config={chartConfigSexo} className="min-h-[280px] w-full">
            <BarChart accessibilityLayer data={edadSexoData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="rango" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Bar dataKey="masculino" fill="var(--color-masculino)" radius={4} />
              <Bar dataKey="femenino" fill="var(--color-femenino)" radius={4} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
        )}
      </PanelCard>
    </Grid>
  )
}