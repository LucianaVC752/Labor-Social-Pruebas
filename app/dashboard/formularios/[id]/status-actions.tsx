"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FormRecord, FormStatus } from "@/types/forms"
import { duplicateForm, setFormStatus } from "../actions"

type StatusAction = { to: FormStatus; label: string; confirm: (name: string) => string }

// Acciones disponibles según el estado actual (las mismas transiciones que valida la base de datos).
const ACTIONS: Partial<Record<FormStatus, StatusAction[]>> = {
  finalizado: [
    {
      to: "cerrado",
      label: "Cerrar captura",
      confirm: (n) => `¿Cerrar «${n}»? Dejará de recibir peticiones nuevas; las que ya existen se siguen gestionando.`,
    },
    {
      to: "archivado",
      label: "Archivar",
      confirm: (n) => `¿Archivar «${n}»? Quedará fuera de uso y sus peticiones en solo lectura. Podrás restaurarlo.`,
    },
    {
      to: "borrador",
      label: "Volver a borrador",
      confirm: (n) =>
        `¿Volver «${n}» a borrador? Solo es posible si no tiene peticiones. Podrás editar su estructura de nuevo y tendrás que finalizarlo otra vez.`,
    },
  ],
  cerrado: [
    {
      to: "finalizado",
      label: "Reabrir captura",
      confirm: (n) => `¿Reabrir «${n}»? Volverá a recibir peticiones nuevas.`,
    },
    {
      to: "archivado",
      label: "Archivar",
      confirm: (n) => `¿Archivar «${n}»? Quedará fuera de uso y sus peticiones en solo lectura. Podrás restaurarlo.`,
    },
  ],
  archivado: [
    {
      to: "cerrado",
      label: "Restaurar",
      confirm: (n) => `¿Restaurar «${n}»? Quedará cerrado: no recibe peticiones nuevas, pero se gestionan las que tiene.`,
    },
  ],
}

export default function StatusActions({ form }: { form: FormRecord }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const actions = ACTIONS[form.status] ?? []

  const change = (action: StatusAction) => {
    if (!window.confirm(action.confirm(form.name))) return
    setError(null)
    startTransition(async () => {
      const res = await setFormStatus(form.id, action.to, form.updated_at)
      if (!res.ok) setError(res.message)
    })
  }

  const duplicate = () => {
    setError(null)
    startTransition(async () => {
      const res = await duplicateForm(form.id)
      if (!res.ok) {
        setError(res.message)
        return
      }
      router.push(`/dashboard/formularios/${res.id}`)
    })
  }

  return (
    <div className="grid gap-2 justify-items-end">
      <div className="flex gap-2 flex-wrap justify-end">
        {actions.map((a) => (
          <Button key={a.to} variant="outline" onClick={() => change(a)} disabled={pending}>
            {a.label}
          </Button>
        ))}
        <Button variant="outline" onClick={duplicate} disabled={pending}>
          <Copy />
          Duplicar
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 max-w-md">
          {error}
        </p>
      ) : null}
    </div>
  )
}
