"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Copy, Plus, Search } from "lucide-react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  FORM_DESCRIPTION_MAX,
  FORM_NAME_MAX,
  FORM_STATUS_LABEL,
  MAX_FIELDS,
  type FormListItem,
  type FormStatus,
} from "@/types/forms"
import { normalizeName } from "@/utils/forms/field-names"
import { createForm, deleteForm, duplicateForm } from "./actions"

const STATUS_CLASS: Record<FormStatus, string> = {
  borrador: "bg-amber-100 text-amber-800",
  finalizado: "bg-green-100 text-green-800",
  cerrado: "bg-neutral-200 text-neutral-700",
  archivado: "bg-neutral-200 text-neutral-700",
}

// Fecha fija en hora de Colombia: el servidor y el navegador muestran lo mismo.
const dateFormat = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "America/Bogota" })

const controlClass =
  "flex w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-50"

export default function FormsManager({ forms }: { forms: FormListItem[] }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [rowError, setRowError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const wanted = normalizeName(query)
  const visible = wanted ? forms.filter((f) => normalizeName(f.name).includes(wanted)) : forms

  const openCreate = () => {
    setName("")
    setDescription("")
    setDialogError(null)
    setOpen(true)
  }

  const create = () => {
    setDialogError(null)
    startTransition(async () => {
      const res = await createForm({ name, description })
      if (!res.ok) {
        setDialogError(res.message)
        return
      }
      router.push(`/dashboard/formularios/${res.id}`)
    })
  }

  const remove = (form: FormListItem) => {
    const detail =
      form.field_count > 0 ? ` Se eliminarán también sus ${form.field_count} campos.` : ""
    if (!window.confirm(`¿Eliminar el borrador "${form.name}"?${detail} No se puede deshacer.`)) return
    setRowError(null)
    startTransition(async () => {
      const res = await deleteForm(form.id)
      if (!res.ok) setRowError(res.message)
    })
  }

  const duplicate = (form: FormListItem) => {
    setRowError(null)
    startTransition(async () => {
      const res = await duplicateForm(form.id)
      if (!res.ok) {
        setRowError(res.message)
        return
      }
      router.push(`/dashboard/formularios/${res.id}`)
    })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" aria-hidden />
          <Input
            aria-label="Buscar formulario por nombre"
            placeholder="Buscar por nombre"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={openCreate}>
          <Plus />
          Nuevo formulario
        </Button>
      </div>

      {rowError ? (
        <p role="alert" className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {rowError}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Formulario</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Campos</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-neutral-600">
                  {forms.length === 0
                    ? "Aún no hay formularios. Crea el primero con «Nuevo formulario»."
                    : "Ningún formulario coincide con la búsqueda."}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/formularios/${f.id}`}
                      className="font-medium text-neutral-900 hover:underline"
                    >
                      {f.name}
                    </Link>
                    {f.description ? (
                      <div className="text-xs text-neutral-600 max-w-md truncate">{f.description}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <span className={cn("inline-block rounded px-2 py-0.5 text-xs", STATUS_CLASS[f.status])}>
                      {FORM_STATUS_LABEL[f.status]}
                    </span>
                  </TableCell>
                  <TableCell>
                    {f.field_count} de {MAX_FIELDS}
                  </TableCell>
                  <TableCell>{dateFormat.format(new Date(f.created_at))}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/formularios/${f.id}`}>
                          {f.status === "borrador" ? "Editar" : "Ver"}
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => duplicate(f)} disabled={pending}>
                        <Copy />
                        Duplicar
                      </Button>
                      {f.status === "borrador" ? (
                        <Button variant="outline" size="sm" onClick={() => remove(f)} disabled={pending}>
                          Eliminar
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => !pending && setOpen(v)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo formulario</DialogTitle>
            <DialogDescription>
              Empieza como borrador: podrás agregar, cambiar y borrar sus campos libremente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="form-name" className="text-sm font-medium text-neutral-800">
                Nombre del formulario <span className="text-red-600">*</span>
              </label>
              <Input
                id="form-name"
                value={name}
                maxLength={FORM_NAME_MAX}
                placeholder="Ej: Solicitud de abono"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="form-description" className="text-sm font-medium text-neutral-800">
                Descripción
              </label>
              <textarea
                id="form-description"
                className={cn(controlClass, "min-h-[90px]")}
                value={description}
                maxLength={FORM_DESCRIPTION_MAX}
                placeholder="Opcional: para qué sirve este formulario"
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {dialogError ? (
            <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {dialogError}
            </p>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={create} disabled={pending}>
              {pending ? "Creando..." : "Crear y diseñar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
