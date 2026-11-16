"use client"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

type FieldType = "text" | "number" | "email" | "password" | "select" | "checkbox" | "radio" | "textarea" | "date"

type FieldOption = { label: string; value: string | number }

export type FieldConfig = {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  required?: boolean
  options?: FieldOption[]
  defaultValue?: string | number | boolean | null
  validate?: (
    value: string | number | boolean | null,
    values: Record<string, string | number | boolean | null>
  ) => string | null
}

export type DynamicFormModalProps = {
  title: string
  description?: string
  fields: FieldConfig[]
  submitLabel?: string
  onSubmit: (
    values: Record<string, string | number | boolean | null>
  ) => Promise<{ ok: boolean; message?: string; id?: number } | void>
  onCloseRoute?: string
  // Ruta a la que ir al guardar con éxito (por defecto, onCloseRoute). Recibe el resultado de onSubmit.
  onSuccessRoute?: (result: { id?: number }) => string | undefined
  defaultOpen?: boolean
}

export function DynamicFormModal({
  title,
  description,
  fields,
  submitLabel = "Guardar",
  onSubmit,
  onCloseRoute = "/dashboard/campesino",
  onSuccessRoute,
  defaultOpen = true,
}: DynamicFormModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(defaultOpen)
  const initialValues = useMemo(() => {
    const v: Record<string, string | number | boolean | null> = {}
    for (const f of fields) v[f.name] = f.defaultValue ?? (f.type === "checkbox" ? false : "")
    return v
  }, [fields])
  const [values, setValues] = useState<Record<string, string | number | boolean | null>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [submitting, setSubmitting] = useState(false)
  const [formMessage, setFormMessage] = useState<string | null>(null)

  useEffect(() => {
    // Asegurar apertura inmediata al cargar la ruta
    setOpen(true)
  }, [])

  const validateAll = (): boolean => {
    const nextErrors: Record<string, string | null> = {}
    for (const f of fields) {
      const val = values[f.name]
      if (f.required && (val === undefined || val === null || val === "")) {
        nextErrors[f.name] = "Este campo es obligatorio"
        continue
      }
      if (f.type === "email" && val) {
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))
        if (!emailOk) nextErrors[f.name] = "Email inválido"
      }
      if (f.type === "number" && val !== "" && isNaN(Number(val))) {
        nextErrors[f.name] = "Debe ser un número"
      }
      if (f.type === "select" && f.options && val !== "") {
        const allowed = f.options.map(o => String(o.value))
        if (!allowed.includes(String(val))) nextErrors[f.name] = "Valor no permitido"
      }
      if (f.validate) {
        const msg = f.validate(val, values)
        if (msg) nextErrors[f.name] = msg
      }
      if (!(f.name in nextErrors)) nextErrors[f.name] = null
    }
    setErrors(nextErrors)
    return Object.values(nextErrors).every(v => v === null)
  }

  const handleClose = () => {
    setOpen(false)
    router.push(onCloseRoute)
  }

  const handleSubmit = async () => {
    setFormMessage(null)
    if (!validateAll()) return
    setSubmitting(true)
    try {
      const res = await onSubmit(values)
      if (res && "ok" in res) {
        setFormMessage(res.ok ? "Guardado correctamente" : res.message ?? "No se pudo guardar")
        if (res.ok) {
          setOpen(false)
          router.push(onSuccessRoute?.(res) ?? onCloseRoute)
        }
      } else {
        handleClose()
      }
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Error inesperado"
      setFormMessage(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const setValue = (name: string, val: string | number | boolean | null) =>
    setValues(prev => ({ ...prev, [name]: val }))

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="p-1"
              onClick={handleClose}
              aria-label="Volver"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <form className="grid gap-4">
          {fields.map((f) => {
            const err = errors[f.name]
            const commonLabel = (
              <label htmlFor={f.name} className="text-sm font-medium text-neutral-800">
                {f.label} {f.required ? <span className="text-red-600">*</span> : null}
              </label>
            )
            const help = err ? (
              <p id={`${f.name}-error`} className="text-xs text-red-600 mt-1">{err}</p>
            ) : null

            if (f.type === "select") {
              return (
                <div key={f.name} className="grid gap-2">
                  {commonLabel}
                  <select
                    id={f.name}
                    className={cn(
                      "flex w-full rounded-md border px-3 py-2 text-sm outline-none",
                      err ? "border-red-500" : "border-neutral-300 focus:ring-2 focus:ring-neutral-400"
                    )}
                    value={String(values[f.name] ?? "")}
                    onChange={(e) => setValue(f.name, e.target.value)}
                    aria-invalid={Boolean(err)}
                    aria-describedby={err ? `${f.name}-error` : undefined}
                  >
                    <option value="">{f.placeholder ?? "Selecciona una opción"}</option>
                    {(f.options ?? []).map((opt) => (
                      <option key={String(opt.value)} value={String(opt.value)}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {help}
                </div>
              )
            }

            if (f.type === "checkbox") {
              return (
                <div key={f.name} className="flex items-center gap-2">
                  <Checkbox
                    id={f.name}
                    checked={Boolean(values[f.name])}
                    onCheckedChange={(v) => setValue(f.name, Boolean(v))}
                  />
                  {commonLabel}
                  {help}
                </div>
              )
            }

            if (f.type === "textarea") {
              return (
                <div key={f.name} className="grid gap-2">
                  {commonLabel}
                  <textarea
                    id={f.name}
                    className={cn("flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm outline-none", err ? "border-red-500" : "border-neutral-300 focus:ring-2 focus:ring-neutral-400")}
                    placeholder={f.placeholder}
                    value={String(values[f.name] ?? "")}
                    onChange={(e) => setValue(f.name, e.target.value)}
                  />
                  {help}
                </div>
              )
            }

            // text, number, email, password, date, radio (simplificado)
            return (
              <div key={f.name} className="grid gap-2">
                {commonLabel}
                {f.type === "radio" ? (
                  <div className="flex flex-wrap gap-3">
                    {(f.options ?? []).map((opt) => (
                      <label key={String(opt.value)} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={f.name}
                          value={String(opt.value)}
                          checked={String(values[f.name]) === String(opt.value)}
                          onChange={(e) => setValue(f.name, e.target.value)}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                ) : (
                  <Input
                    id={f.name}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={String(values[f.name] ?? "")}
                    onChange={(e) => setValue(f.name, e.target.value)}
                    className={cn(err ? "border-red-500" : "")}
                  />
                )}
                {help}
              </div>
            )
          })}
        </form>

        {formMessage ? (
          <p className="text-xs text-neutral-700 bg-neutral-100 border border-neutral-200 rounded px-2 py-1">{formMessage}</p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>Cancelar</Button>
          <Button type="button" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSubmit} disabled={submitting}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
