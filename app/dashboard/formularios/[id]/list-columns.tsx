"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { FIELD_TYPES, MAX_LIST_COLUMNS, type FormField } from "@/types/forms"
import { setListColumns } from "../actions"

const typeLabel = (t: FormField["type"]) => FIELD_TYPES.find((x) => x.value === t)?.label ?? t

/**
 * Casillas para elegir hasta MAX_LIST_COLUMNS campos que se mostrarán como columnas
 * en la lista de peticiones. Se muestran en el orden en que se marcan.
 */
export function ListColumnsPicker({
  fields,
  value,
  onChange,
  disabled = false,
}: {
  fields: FormField[]
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}) {
  const full = value.length >= MAX_LIST_COLUMNS

  const toggle = (key: string, checked: boolean) =>
    onChange(checked ? [...value, key] : value.filter((k) => k !== key))

  if (fields.length === 0) {
    return <p className="text-sm text-neutral-600">Este formulario aún no tiene campos.</p>
  }

  return (
    <div className="grid gap-2">
      {fields.map((f) => {
        const index = value.indexOf(f.key)
        const checked = index !== -1
        return (
          <label
            key={f.id}
            className={cn(
              "flex items-center gap-2 text-sm text-neutral-800",
              !checked && (full || disabled) && "opacity-60"
            )}
          >
            <Checkbox
              checked={checked}
              disabled={disabled || (!checked && full)}
              aria-label={`Mostrar «${f.label}» como columna`}
              onCheckedChange={(v) => toggle(f.key, v === true)}
            />
            <span>
              {f.label} <span className="text-xs text-neutral-500">({typeLabel(f.type)})</span>
            </span>
            {checked ? (
              <span className="text-xs text-neutral-600">columna {index + 1}</span>
            ) : null}
          </label>
        )
      })}
      <p className="text-xs text-neutral-600">
        Puedes elegir hasta {MAX_LIST_COLUMNS}. Aparecen en el orden en que las marques.
      </p>
    </div>
  )
}

/**
 * Editor de columnas destacadas para un formulario ya finalizado o cerrado.
 * (En un archivado solo se muestran.)
 */
export default function ListColumnsEditor({
  formId,
  fields,
  initial,
  expectedUpdatedAt,
  readOnly,
}: {
  formId: number
  fields: FormField[]
  initial: string[]
  expectedUpdatedAt: string
  readOnly: boolean
}) {
  const [value, setValue] = useState<string[]>(initial)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const dirty = value.length !== initial.length || value.some((k, i) => k !== initial[i])

  const save = () => {
    setMessage(null)
    startTransition(async () => {
      const res = await setListColumns(formId, value, expectedUpdatedAt)
      setMessage(res.ok ? { ok: true, text: "Columnas guardadas." } : { ok: false, text: res.message })
    })
  }

  return (
    <div className="grid gap-3">
      <ListColumnsPicker fields={fields} value={value} onChange={setValue} disabled={readOnly || pending} />
      {readOnly ? null : (
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={save}
            disabled={!dirty || pending}
          >
            {pending ? "Guardando..." : "Guardar columnas"}
          </Button>
          {message ? (
            <p
              role={message.ok ? "status" : "alert"}
              className={cn("text-sm", message.ok ? "text-green-800" : "text-red-700")}
            >
              {message.text}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
