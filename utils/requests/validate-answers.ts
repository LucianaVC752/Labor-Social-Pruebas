import type { FormField } from "@/types/forms"
import {
  DETAIL_MAX,
  DETAIL_MIN,
  TEXTAREA_MAX,
  TEXT_MAX,
  type Answers,
} from "@/types/requests"

export type AnswersValidation =
  | { ok: true; answers: Answers }
  | { ok: false; errors: Record<string, string> }

const REQUIRED = "Este campo es obligatorio."

// Texto limpio de lo que llegue (los números se aceptan como texto).
const asText = (v: unknown): string =>
  typeof v === "string" ? v.trim() : typeof v === "number" && Number.isFinite(v) ? String(v) : ""

function isValidDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return false
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const date = new Date(Date.UTC(y, mo - 1, d))
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === mo - 1 &&
    date.getUTCDate() === d &&
    y >= 1900 &&
    y <= 2100
  )
}

/**
 * Valida las respuestas de una petición contra la estructura del formulario.
 * La usan la pantalla (para avisar antes de enviar) y el servidor (que es quien manda).
 * Solo devuelve respuestas de campos del formulario; lo demás se ignora.
 */
export function validateAnswers(
  fields: FormField[],
  raw: Record<string, unknown>,
  villageCodes: Iterable<number | string>
): AnswersValidation {
  const villages = new Set(Array.from(villageCodes, (c) => String(c)))
  const answers: Answers = {}
  const errors: Record<string, string> = {}

  for (const f of fields) {
    const v = raw[f.key]
    const rules = f.validation ?? {}

    switch (f.type) {
      case "text":
      case "textarea": {
        const s = asText(v)
        if (!s) {
          if (f.required) errors[f.key] = REQUIRED
          break
        }
        const max = Math.min(rules.maxLength ?? Infinity, f.type === "text" ? TEXT_MAX : TEXTAREA_MAX)
        const min = rules.minLength ?? 0
        if (s.length > max) errors[f.key] = `Máximo ${max} caracteres.`
        else if (s.length < min) errors[f.key] = `Mínimo ${min} caracteres.`
        else answers[f.key] = s
        break
      }

      case "number": {
        const s = asText(v)
        if (!s) {
          if (f.required) errors[f.key] = REQUIRED
          break
        }
        if (!/^-?\d+([.,]\d+)?$/.test(s)) {
          errors[f.key] = "Escribe un número válido."
          break
        }
        const n = Number(s.replace(",", "."))
        if (!Number.isFinite(n) || Math.abs(n) > 1e12) errors[f.key] = "Escribe un número válido."
        else if (rules.min !== undefined && n < rules.min) errors[f.key] = `Debe ser mayor o igual a ${rules.min}.`
        else if (rules.max !== undefined && n > rules.max) errors[f.key] = `Debe ser menor o igual a ${rules.max}.`
        else answers[f.key] = n
        break
      }

      case "date": {
        const s = asText(v)
        if (!s) {
          if (f.required) errors[f.key] = REQUIRED
          break
        }
        if (!isValidDate(s)) errors[f.key] = "Escribe una fecha válida."
        else answers[f.key] = s
        break
      }

      case "select": {
        const obj =
          v !== null && typeof v === "object"
            ? (v as { value?: unknown; detail?: unknown })
            : { value: v, detail: undefined }
        const value = typeof obj.value === "string" ? obj.value : ""
        if (!value) {
          if (f.required) errors[f.key] = REQUIRED
          break
        }
        const option = (f.options ?? []).find((o) => o.value === value)
        if (!option) {
          errors[f.key] = "Elige una de las opciones de la lista."
          break
        }
        if (option.askDetail) {
          const detail = typeof obj.detail === "string" ? obj.detail.trim() : ""
          if (detail.length < DETAIL_MIN || detail.length > DETAIL_MAX) {
            errors[f.key] = `Escribe la especificación (entre ${DETAIL_MIN} y ${DETAIL_MAX} caracteres).`
            break
          }
          answers[f.key] = { value, detail }
        } else {
          answers[f.key] = { value }
        }
        break
      }

      case "checkbox": {
        const checked = v === true
        if (f.required && !checked) errors[f.key] = "Debes marcar esta casilla."
        else answers[f.key] = checked
        break
      }

      case "village": {
        const s = asText(v)
        if (!s) {
          if (f.required) errors[f.key] = REQUIRED
          break
        }
        if (!/^\d+$/.test(s) || !villages.has(s)) errors[f.key] = "Elige una vereda de la lista."
        else answers[f.key] = Number(s)
        break
      }
    }
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, answers }
}
