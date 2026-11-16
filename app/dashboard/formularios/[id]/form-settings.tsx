"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  FARMER_FIELDS,
  FORM_DESCRIPTION_MAX,
  FORM_NAME_MAX,
  type FarmerFieldKey,
  type FormRecord,
} from "@/types/forms"
import { updateForm } from "../actions"

const controlClass =
  "flex w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-50"

export default function FormSettings({ form, readOnly }: { form: FormRecord; readOnly: boolean }) {
  const [name, setName] = useState(form.name)
  const [description, setDescription] = useState(form.description ?? "")
  const [farmerFields, setFarmerFields] = useState<FarmerFieldKey[]>(form.farmer_fields)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const sameFields =
    farmerFields.length === form.farmer_fields.length &&
    farmerFields.every((f) => form.farmer_fields.includes(f))
  const dirty =
    name.trim() !== form.name || description.trim() !== (form.description ?? "") || !sameFields

  const toggle = (key: FarmerFieldKey, checked: boolean) =>
    setFarmerFields((prev) => (checked ? [...prev, key] : prev.filter((k) => k !== key)))

  const save = () => {
    setMessage(null)
    startTransition(async () => {
      const res = await updateForm(form.id, { name, description, farmer_fields: farmerFields }, form.updated_at)
      setMessage(res.ok ? { ok: true, text: "Cambios guardados." } : { ok: false, text: res.message })
    })
  }

  return (
    <div className="rounded-md border p-4 grid gap-4">
      <h2 className="text-xl font-semibold text-neutral-800">Datos del formulario</h2>

      <div className="grid gap-2 max-w-xl">
        <label htmlFor="settings-name" className="text-sm font-medium text-neutral-800">
          Nombre del formulario
        </label>
        <Input
          id="settings-name"
          value={name}
          maxLength={FORM_NAME_MAX}
          disabled={readOnly}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid gap-2 max-w-xl">
        <label htmlFor="settings-description" className="text-sm font-medium text-neutral-800">
          Descripción
        </label>
        <textarea
          id="settings-description"
          className={cn(controlClass, "min-h-[80px]")}
          value={description}
          maxLength={FORM_DESCRIPTION_MAX}
          disabled={readOnly}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <fieldset className="grid gap-2" disabled={readOnly}>
        <legend className="text-sm font-medium text-neutral-800">
          Datos del campesino que se muestran en cada petición
        </legend>
        <p className="text-xs text-neutral-600 max-w-xl">
          Se leen del registro del campesino y no se escriben en el formulario. Si el registro cambia, la
          petición muestra el dato actualizado.
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <Checkbox checked disabled aria-label="Nombre y cédula (siempre se muestran)" />
            Nombre y cédula <span className="text-xs text-neutral-500">(siempre)</span>
          </label>
          {FARMER_FIELDS.map((f) => (
            <label key={f.value} className="flex items-center gap-2 text-sm text-neutral-800">
              <Checkbox
                checked={farmerFields.includes(f.value)}
                onCheckedChange={(v) => toggle(f.value, v === true)}
              />
              {f.label}
            </label>
          ))}
        </div>
      </fieldset>

      {readOnly ? null : (
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={save}
            disabled={!dirty || pending}
          >
            {pending ? "Guardando..." : "Guardar cambios"}
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
