"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { OPTIONS_MIN, type FormField, type FormRecord } from "@/types/forms"
import { normalizeName } from "@/utils/forms/field-names"
import { finalizeForm } from "../actions"
import { ListColumnsPicker } from "./list-columns"

function Requirement({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  const Icon = ok ? CheckCircle2 : Circle
  return (
    <li className={cn("flex items-center gap-2 text-sm", ok ? "text-green-800" : "text-red-700")}>
      <Icon className="size-4 shrink-0" aria-hidden />
      {children}
    </li>
  )
}

export default function FinalizeDialog({ form, fields }: { form: FormRecord; fields: FormField[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmName, setConfirmName] = useState("")
  const [columns, setColumns] = useState<string[]>([])
  const [error, setError] = useState<{ message: string; conflict: boolean } | null>(null)
  const [pending, startTransition] = useTransition()

  const hasFields = fields.length > 0
  const listsOk = fields.every((f) => f.type !== "select" || (f.options?.length ?? 0) >= OPTIONS_MIN)
  const nameMatches = normalizeName(confirmName) !== "" && normalizeName(confirmName) === normalizeName(form.name)
  const canConfirm = hasFields && listsOk && nameMatches && !pending

  const openDialog = () => {
    setConfirmName("")
    // Solo se conservan las columnas que todavía son campos del formulario
    setColumns((prev) => prev.filter((k) => fields.some((f) => f.key === k)))
    setError(null)
    setOpen(true)
  }

  const confirm = () => {
    setError(null)
    startTransition(async () => {
      const res = await finalizeForm(form.id, {
        expectedUpdatedAt: form.updated_at,
        confirmName,
        listColumns: columns,
      })
      if (!res.ok) {
        setError({ message: res.message, conflict: res.code === "40001" })
        return
      }
      setOpen(false)
      // El resumen muestra el mensaje de éxito con el nombre del formulario
      router.replace(`/dashboard/formularios/${form.id}?finalizado=1`)
    })
  }

  const reload = () => {
    setError(null)
    router.refresh()
  }

  return (
    <>
      <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={openDialog}>
        Finalizar formulario
      </Button>

      <Dialog open={open} onOpenChange={(v) => !pending && setOpen(v)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar formulario</DialogTitle>
            <DialogDescription>
              Al finalizar, la estructura queda congelada: ya no se podrán agregar, cambiar ni borrar campos.
              Para hacer cambios después tendrás que duplicar el formulario.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <ul className="grid gap-1.5">
              <Requirement ok={hasFields}>
                {hasFields ? `Tiene ${fields.length} ${fields.length === 1 ? "campo" : "campos"}` : "Agrega al menos 1 campo"}
              </Requirement>
              <Requirement ok={listsOk}>Las listas tienen {OPTIONS_MIN} o más opciones</Requirement>
            </ul>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-neutral-800">
                Columnas destacadas en la lista de peticiones (opcional)
              </span>
              <ListColumnsPicker fields={fields} value={columns} onChange={setColumns} disabled={pending} />
            </div>

            <div className="grid gap-2">
              <label htmlFor="finalize-name" className="text-sm font-medium text-neutral-800">
                Para confirmar, escribe el nombre del formulario: <strong>{form.name}</strong>
              </label>
              <Input
                id="finalize-name"
                value={confirmName}
                autoComplete="off"
                disabled={pending}
                onChange={(e) => setConfirmName(e.target.value)}
              />
            </div>
          </div>

          {error ? (
            <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 grid gap-2">
              <p>{error.message}</p>
              {error.conflict ? (
                <div>
                  <Button variant="outline" size="sm" onClick={reload}>
                    Recargar formulario
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={confirm} disabled={!canConfirm}>
              {pending ? "Finalizando..." : "Finalizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
