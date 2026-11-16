"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { FARMER_FIELDS, type FormField, type FormRecord } from "@/types/forms"
import type { FarmerCard, FarmerSearchResult } from "@/types/requests"
import type { Place } from "@/types/village"
import { validateAnswers } from "@/utils/requests/validate-answers"
import { createRequest, loadFarmerForRequest } from "../../../../peticiones/actions"
import FarmerSearch from "./farmer-search"



type Initial = { farmer: FarmerCard; openRequests: number } | null
type FormInfo = Pick<FormRecord, "id" | "name" | "description" | "farmer_fields">

const SEX_LABEL: Record<string, string> = { M: "Masculino", F: "Femenino" }

const controlClass = (error: boolean) =>
  cn(
    "flex w-full rounded-md border px-3 py-2 text-sm outline-none bg-white",
    error ? "border-red-500" : "border-neutral-300 focus:ring-2 focus:ring-neutral-400"
  )

function farmerDatum(farmer: FarmerCard, key: (typeof FARMER_FIELDS)[number]["value"]): string {
  switch (key) {
    case "phone":
      return farmer.phone || "—"
    case "email":
      return farmer.email || "—"
    case "age":
      return farmer.age != null ? `${farmer.age} años` : "—"
    case "sex":
      return farmer.sex ? (SEX_LABEL[farmer.sex] ?? farmer.sex) : "—"
    case "village":
      return farmer.village || "—"
  }
}

export default function RequestForm({
  form,
  fields,
  villages,
  initial,
}: {
  form: FormInfo
  fields: FormField[]
  villages: Place[]
  initial: Initial
}) {
  const [farmer, setFarmer] = useState<FarmerCard | null>(initial?.farmer ?? null)
  const [openRequests, setOpenRequests] = useState(initial?.openRequests ?? 0)
  const [loadingFarmer, setLoadingFarmer] = useState(false)
  const [farmerError, setFarmerError] = useState<string | null>(null)

  // Respuestas: texto/lista/vereda/fecha/número como texto, casillas como sí/no, y la especificación de las listas
  const [values, setValues] = useState<Record<string, string | boolean>>({})
  const [details, setDetails] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState<{ code: string; farmerName: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const setValue = (key: string, v: string | boolean) => {
    setValues((prev) => ({ ...prev, [key]: v }))
    setErrors((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const selectFarmer = async (found: FarmerSearchResult) => {
    setFarmerError(null)
    setLoadingFarmer(true)
    try {
      const res = await loadFarmerForRequest(found.id, form.id)
      if (!res) {
        setFarmerError("No se pudo cargar al campesino. Inténtalo de nuevo.")
        return
      }
      setFarmer(res.farmer)
      setOpenRequests(res.openRequests)
    } catch {
      setFarmerError("No se pudo cargar al campesino. Inténtalo de nuevo.")
    } finally {
      setLoadingFarmer(false)
    }
  }

  const changeFarmer = () => {
    setFarmer(null)
    setOpenRequests(0)
    setFormError(null)
  }

  const buildRaw = (): Record<string, unknown> => {
    const raw: Record<string, unknown> = {}
    for (const f of fields) {
      const v = values[f.key]
      if (f.type === "select") raw[f.key] = { value: typeof v === "string" ? v : "", detail: details[f.key] ?? "" }
      else if (f.type === "checkbox") raw[f.key] = v === true
      else raw[f.key] = typeof v === "string" ? v : ""
    }
    return raw
  }

  const submit = () => {
    setFormError(null)
    if (!farmer) return
    const raw = buildRaw()
    const check = validateAnswers(fields, raw, villages.map((v) => v.codigo))
    if (!check.ok) {
      setErrors(check.errors)
      setFormError("Revisa los campos marcados.")
      return
    }
    setErrors({})
    startTransition(async () => {
      const res = await createRequest(form.id, farmer.id, raw)
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {})
        setFormError(res.message)
        return
      }
      setDone({ code: res.code, farmerName: farmer.full_name })
    })
  }

  const reset = () => {
    setFarmer(null)
    setOpenRequests(0)
    setValues({})
    setDetails({})
    setErrors({})
    setFormError(null)
    setDone(null)
  }

  if (done) {
    return (
      <div className="grid gap-4">
        <p role="status" className="text-green-900 bg-green-50 border border-green-200 rounded px-4 py-3">
          Petición <strong>{done.code}</strong> registrada para {done.farmerName}.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={reset}>
            Registrar otra petición
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/formularios/${form.id}`}>Volver al formulario</Link>
          </Button>
        </div>
      </div>
    )
  }

  const extraFarmerFields = FARMER_FIELDS.filter((f) => form.farmer_fields.includes(f.value) && f.value !== "village")

  return (
    <div className="grid gap-8">
      <section className="grid gap-3">
        <h2 className="text-xl font-semibold text-neutral-800">1. Campesino</h2>

        {farmer ? (
          <>
            <div className="rounded-md border p-4 flex justify-between items-start gap-4 flex-wrap">
              <div>
                <p className="text-lg font-semibold text-neutral-900">{farmer.full_name}</p>
                <p className="text-sm text-neutral-700">
                  Cédula {farmer.farmer_cc}
                  {farmer.village ? ` · Vereda ${farmer.village}` : ""}
                </p>
              </div>
              <Button variant="outline" onClick={changeFarmer} disabled={pending}>
                Cambiar
              </Button>
            </div>

            {extraFarmerFields.length > 0 ? (
              <dl className="grid gap-3 sm:grid-cols-2 rounded-md bg-neutral-50 border p-4">
                {extraFarmerFields.map((f) => (
                  <div key={f.value} className="grid gap-0.5">
                    <dt className="text-xs text-neutral-600">{f.label}</dt>
                    <dd className="text-sm font-medium text-neutral-900">{farmerDatum(farmer, f.value)}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {openRequests > 0 ? (
              <p role="status" className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                Este campesino ya tiene {openRequests} {openRequests === 1 ? "petición abierta" : "peticiones abiertas"} en
                este formulario. Puedes registrar otra si hace falta.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <FarmerSearch formId={form.id} onSelect={selectFarmer} disabled={loadingFarmer} />
            {loadingFarmer ? <p className="text-sm text-neutral-600">Cargando campesino...</p> : null}
            {farmerError ? (
              <p role="alert" className="text-sm text-red-700">
                {farmerError}
              </p>
            ) : null}
          </>
        )}
      </section>

      {farmer ? (
        <section className="grid gap-4">
          <h2 className="text-xl font-semibold text-neutral-800">2. Datos de la petición</h2>

          {fields.map((f) => {
            const error = errors[f.key]
            const id = `field-${f.key}`
            const value = values[f.key]
            const text = typeof value === "string" ? value : ""
            const label = (
              <label htmlFor={id} className="text-sm font-medium text-neutral-800">
                {f.label} {f.required ? <span className="text-red-600">*</span> : null}
              </label>
            )
            const help = error ? (
              <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
                {error}
              </p>
            ) : null
            const aria = { "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-error` : undefined }

            if (f.type === "checkbox") {
              return (
                <div key={f.id} className="grid gap-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={id}
                      checked={value === true}
                      disabled={pending}
                      onCheckedChange={(v) => setValue(f.key, v === true)}
                    />
                    {label}
                  </div>
                  {help}
                </div>
              )
            }

            if (f.type === "select" || f.type === "village") {
              const options =
                f.type === "village"
                  ? villages.map((v) => ({ value: String(v.codigo), label: v.description, askDetail: false }))
                  : (f.options ?? []).map((o) => ({ value: o.value, label: o.label, askDetail: Boolean(o.askDetail) }))
              const chosen = options.find((o) => o.value === text)
              return (
                <div key={f.id} className="grid gap-2">
                  {label}
                  <select
                    id={id}
                    className={controlClass(Boolean(error))}
                    value={text}
                    disabled={pending}
                    onChange={(e) => setValue(f.key, e.target.value)}
                    {...aria}
                  >
                    <option value="">{f.placeholder || "Selecciona una opción"}</option>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {chosen?.askDetail ? (
                    <Input
                      aria-label={`Especificación de «${chosen.label}»`}
                      placeholder={`Especifica: ${chosen.label}`}
                      value={details[f.key] ?? ""}
                      disabled={pending}
                      onChange={(e) => {
                        setDetails((prev) => ({ ...prev, [f.key]: e.target.value }))
                        setErrors((prev) => {
                          if (!(f.key in prev)) return prev
                          const next = { ...prev }
                          delete next[f.key]
                          return next
                        })
                      }}
                      className={error ? "border-red-500" : ""}
                    />
                  ) : null}
                  {help}
                </div>
              )
            }

            if (f.type === "textarea") {
              return (
                <div key={f.id} className="grid gap-2">
                  {label}
                  <textarea
                    id={id}
                    className={cn(controlClass(Boolean(error)), "min-h-[96px]")}
                    placeholder={f.placeholder ?? undefined}
                    value={text}
                    disabled={pending}
                    onChange={(e) => setValue(f.key, e.target.value)}
                    {...aria}
                  />
                  {help}
                </div>
              )
            }

            // text, number, date
            return (
              <div key={f.id} className="grid gap-2">
                {label}
                <Input
                  id={id}
                  type={f.type === "date" ? "date" : "text"}
                  inputMode={f.type === "number" ? "decimal" : undefined}
                  placeholder={f.placeholder ?? undefined}
                  value={text}
                  disabled={pending}
                  onChange={(e) => setValue(f.key, e.target.value)}
                  className={error ? "border-red-500" : ""}
                  {...aria}
                />
                {help}
              </div>
            )
          })}

          {formError ? (
            <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {formError}
            </p>
          ) : null}

          <div className="flex gap-2 flex-wrap">
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={submit} disabled={pending}>
              {pending ? "Registrando..." : "Registrar petición"}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/formularios/${form.id}`}>Cancelar</Link>
            </Button>
          </div>
        </section>
      ) : (
        <p className="text-sm text-neutral-600">Elige primero al campesino para completar los datos de la petición.</p>
      )}
    </div>
  )
}
