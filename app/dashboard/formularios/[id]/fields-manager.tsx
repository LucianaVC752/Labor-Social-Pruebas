"use client"

import { useState, useTransition } from "react"
import { ChevronDown, ChevronsDown, ChevronsUp, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  FIELD_TYPES,
  MAX_FIELDS,
  OPTIONS_MAX,
  OPTIONS_MIN,
  type ActionResult,
  type FieldInput,
  type FieldType,
  type FormField,
} from "@/types/forms"
import type { MoveAction } from "@/utils/forms/field-order"
import { usesPlaceholder } from "@/utils/forms/field-rules"
import { createField, deleteField, moveField, updateField } from "./actions"

const emptyOptions = () =>
  Array.from({ length: OPTIONS_MIN }, () => ({ label: "", askDetail: false }))

const EMPTY_FORM: FieldInput = { label: "", type: "text", required: false, placeholder: "", options: [] }

const controlClass =
  "flex w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-50"

const typeLabel = (t: FieldType) => FIELD_TYPES.find((x) => x.value === t)?.label ?? t

/* ---------- Botones de orden de una fila ---------- */

function OrderButtons({
  field,
  index,
  count,
  disabled,
  onMove,
}: {
  field: FormField
  index: number
  count: number
  disabled: boolean
  onMove: (id: number, action: MoveAction) => void
}) {
  const atStart = index === 0
  const atEnd = index === count - 1
  const items = [
    { action: "top", label: "Enviar al inicio", Icon: ChevronsUp, off: atStart },
    { action: "up", label: "Subir una posición", Icon: ChevronUp, off: atStart },
    { action: "down", label: "Bajar una posición", Icon: ChevronDown, off: atEnd },
    { action: "bottom", label: "Enviar al final", Icon: ChevronsDown, off: atEnd },
  ] as const

  return (
    <div className="flex gap-0.5">
      {items.map(({ action, label, Icon, off }) => (
        <Button
          key={action}
          variant="ghost"
          size="icon-sm"
          title={label}
          aria-label={`${label}: ${field.label}`}
          disabled={disabled || off}
          onClick={() => onMove(field.id, action)}
        >
          <Icon />
        </Button>
      ))}
    </div>
  )
}

/* ---------- Pantalla de campos ---------- */

export default function FieldsManager({
  formId,
  fields,
  readOnly,
}: {
  formId: number
  fields: FormField[]
  readOnly: boolean
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FormField | null>(null)
  const [form, setForm] = useState<FieldInput>(EMPTY_FORM)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [rowError, setRowError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const atLimit = fields.length >= MAX_FIELDS
  // Un formulario solo puede tener un campo de vereda
  const villageTaken = fields.some((f) => f.type === "village" && f.id !== editing?.id)

  const set = <K extends keyof FieldInput>(key: K, value: FieldInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const setOption = (index: number, patch: Partial<FieldInput["options"][number]>) =>
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    }))

  const addOption = () =>
    setForm((prev) => ({ ...prev, options: [...prev.options, { label: "", askDetail: false }] }))

  const removeOption = (index: number) =>
    setForm((prev) => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }))

  const changeType = (type: FieldType) =>
    setForm((prev) => ({
      ...prev,
      type,
      // Al elegir "Lista de opciones" se empieza con dos filas para llenar
      options: type === "select" && prev.options.length === 0 ? emptyOptions() : prev.options,
    }))

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogError(null)
    setOpen(true)
  }

  const openEdit = (field: FormField) => {
    setEditing(field)
    setForm({
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder ?? "",
      options: (field.options ?? []).map((o) => ({ label: o.label, askDetail: Boolean(o.askDetail) })),
    })
    setDialogError(null)
    setOpen(true)
  }

  const save = () => {
    setDialogError(null)
    startTransition(async () => {
      const res = editing ? await updateField(editing.id, form) : await createField(formId, form)
      if (!res.ok) {
        setDialogError(res.message)
        return
      }
      setOpen(false)
    })
  }

  const runRowAction = (action: () => Promise<ActionResult>) => {
    setRowError(null)
    startTransition(async () => {
      const res = await action()
      if (!res.ok) setRowError(res.message)
    })
  }

  const move = (id: number, action: MoveAction) => runRowAction(() => moveField(id, action))

  const remove = (field: FormField) => {
    if (!window.confirm(`¿Eliminar el campo "${field.label}"? No se puede deshacer.`)) return
    runRowAction(() => deleteField(field.id))
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <p className="text-sm text-neutral-600">
          {fields.length} de {MAX_FIELDS} campos
        </p>
        {readOnly ? null : (
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={openCreate}
            disabled={atLimit}
            title={atLimit ? `Máximo de ${MAX_FIELDS} campos alcanzado` : undefined}
          >
            <Plus />
            Agregar campo
          </Button>
        )}
      </div>

      {atLimit && !readOnly ? (
        <p className="mb-4 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Se alcanzó el máximo de {MAX_FIELDS} campos. Elimina alguno para poder agregar otro.
        </p>
      ) : null}

      {rowError ? (
        <p role="alert" className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {rowError}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {readOnly ? null : <TableHead className="w-40">Orden</TableHead>}
              <TableHead>Campo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Obligatorio</TableHead>
              {readOnly ? null : <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 ? (
              <TableRow>
                <TableCell colSpan={readOnly ? 3 : 5} className="h-24 text-center text-neutral-600">
                  Este formulario aún no tiene campos.{readOnly ? "" : " Agrega el primero."}
                </TableCell>
              </TableRow>
            ) : (
              fields.map((f, i) => (
                <TableRow key={f.id}>
                  {readOnly ? null : (
                    <TableCell>
                      <OrderButtons
                        field={f}
                        index={i}
                        count={fields.length}
                        disabled={pending}
                        onMove={move}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="font-medium text-neutral-900">{f.label}</div>
                    {f.type === "select" && f.options?.length ? (
                      <div className="text-xs text-neutral-600 max-w-md truncate">
                        {f.options
                          .map((o) => (o.askDetail ? `${o.label} (pide detalle)` : o.label))
                          .join(", ")}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>{typeLabel(f.type)}</TableCell>
                  <TableCell>{f.required ? "Sí" : "No"}</TableCell>
                  {readOnly ? null : (
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(f)} disabled={pending}>
                          <Pencil />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => remove(f)} disabled={pending}>
                          <Trash2 />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => !pending && setOpen(v)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar campo" : "Agregar campo"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Puedes cambiar cualquier cosa, incluido el tipo: el formulario aún es un borrador y no tiene peticiones."
                : "Elige cómo se llama el dato y qué tipo de respuesta se espera."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="field-label" className="text-sm font-medium text-neutral-800">
                Nombre del campo <span className="text-red-600">*</span>
              </label>
              <Input
                id="field-label"
                value={form.label}
                placeholder="Ej: Tipo de solicitud"
                onChange={(e) => set("label", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="field-type" className="text-sm font-medium text-neutral-800">
                Tipo de respuesta
              </label>
              <select
                id="field-type"
                className={controlClass}
                value={form.type}
                onChange={(e) => changeType(e.target.value as FieldType)}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value} disabled={t.value === "village" && villageTaken}>
                    {t.label}
                    {t.value === "village" && villageTaken ? " (ya hay uno)" : ""}
                  </option>
                ))}
              </select>
              {form.type === "village" ? (
                <p className="text-xs text-neutral-600">
                  Se elige entre las veredas registradas. Solo se permite un campo de vereda por formulario.
                </p>
              ) : null}
            </div>

            {form.type === "select" ? (
              <div className="grid gap-2">
                <span className="text-sm font-medium text-neutral-800">
                  Opciones <span className="text-red-600">*</span>
                </span>
                {form.options.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      aria-label={`Opción ${i + 1}`}
                      value={o.label}
                      placeholder={`Opción ${i + 1}`}
                      onChange={(e) => setOption(i, { label: e.target.value })}
                    />
                    <label className="flex items-center gap-1.5 text-xs text-neutral-700 whitespace-nowrap">
                      <Checkbox
                        checked={o.askDetail}
                        aria-label={`La opción ${i + 1} pide especificación`}
                        onCheckedChange={(v) => setOption(i, { askDetail: v === true })}
                      />
                      Pide especificación
                    </label>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Quitar la opción ${i + 1}`}
                      disabled={form.options.length <= OPTIONS_MIN}
                      onClick={() => removeOption(i)}
                    >
                      <X />
                    </Button>
                  </div>
                ))}
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    disabled={form.options.length >= OPTIONS_MAX}
                  >
                    <Plus />
                    Agregar opción
                  </Button>
                </div>
                <p className="text-xs text-neutral-600">
                  Marca «Pide especificación» en las opciones que necesitan más detalle: por ejemplo,
                  «Semillas» pedirá «¿Qué semillas?» y será obligatorio escribirlo.
                </p>
              </div>
            ) : null}

            {usesPlaceholder(form.type) ? (
              <div className="grid gap-2">
                <label htmlFor="field-placeholder" className="text-sm font-medium text-neutral-800">
                  Texto de ayuda
                </label>
                <Input
                  id="field-placeholder"
                  value={form.placeholder}
                  placeholder="Opcional"
                  onChange={(e) => set("placeholder", e.target.value)}
                />
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <Checkbox
                id="field-required"
                checked={form.required}
                onCheckedChange={(v) => set("required", v === true)}
              />
              <label htmlFor="field-required" className="text-sm font-medium text-neutral-800">
                Campo obligatorio
              </label>
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
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={save} disabled={pending}>
              {pending ? "Guardando..." : "Guardar campo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
