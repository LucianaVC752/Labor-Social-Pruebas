import {
  FARMER_FIELDS,
  FIELD_LABEL_MAX,
  FIELD_LABEL_MIN,
  FIELD_TYPES,
  FORM_DESCRIPTION_MAX,
  FORM_NAME_MAX,
  FORM_NAME_MIN,
  OPTIONS_MAX,
  OPTIONS_MIN,
  PLACEHOLDER_MAX,
  type FarmerFieldKey,
  type FieldInput,
  type FieldOption,
  type FieldType,
} from "@/types/forms"
import { slugify } from "./field-names"

// El nombre del formulario se usa en nombres de archivo y de hojas de Excel,
// que no admiten estos caracteres.
const INVALID_NAME_CHARS = /[\\/:*?"<>|[\]]/

/** Los tipos donde tiene sentido un texto de ayuda. */
export function usesPlaceholder(type: FieldType): boolean {
  return type === "text" || type === "textarea" || type === "number" || type === "select"
}

/**
 * Convierte las opciones escritas por la persona en las que se guardan:
 * quita vacías, genera el valor interno a partir de la etiqueta y descarta repetidas.
 */
export function buildOptions(options: FieldInput["options"]): FieldOption[] {
  const seen = new Set<string>()
  const built: FieldOption[] = []
  for (const o of options) {
    const label = o.label.trim()
    const value = slugify(label)
    if (!label || !value || seen.has(value)) continue
    seen.add(value)
    built.push({ label, value, ...(o.askDetail ? { askDetail: true } : {}) })
  }
  return built
}

export function validateFormName(name: string): string | null {
  const n = name.trim()
  if (n.length < FORM_NAME_MIN || n.length > FORM_NAME_MAX) {
    return `El nombre del formulario debe tener entre ${FORM_NAME_MIN} y ${FORM_NAME_MAX} caracteres.`
  }
  if (INVALID_NAME_CHARS.test(n)) {
    return 'El nombre no puede incluir estos caracteres: \\ / : * ? " < > | [ ]'
  }
  return null
}

export function validateFormDescription(description: string): string | null {
  return description.trim().length > FORM_DESCRIPTION_MAX
    ? `La descripción puede tener máximo ${FORM_DESCRIPTION_MAX} caracteres.`
    : null
}

/** Valida los datos de un campo antes de guardarlo. Devuelve el mensaje de error, o null si está bien. */
export function validateFieldInput(input: FieldInput): string | null {
  const label = input.label.trim()
  if (label.length < FIELD_LABEL_MIN || label.length > FIELD_LABEL_MAX) {
    return `El nombre del campo debe tener entre ${FIELD_LABEL_MIN} y ${FIELD_LABEL_MAX} caracteres.`
  }
  if (!slugify(label)) return "El nombre del campo debe incluir letras o números."
  if (!FIELD_TYPES.some((t) => t.value === input.type)) return "El tipo de campo no es válido."
  if (input.placeholder.trim().length > PLACEHOLDER_MAX) {
    return `El texto de ayuda es muy largo (máximo ${PLACEHOLDER_MAX} caracteres).`
  }
  if (input.type === "select") {
    const typed = input.options.filter((o) => o.label.trim() !== "")
    const built = buildOptions(input.options)
    // Primero las repetidas: "Abono" y "abono" no deben terminar en "agrega al menos 2".
    if (built.length !== typed.length) {
      return "Hay opciones repetidas o demasiado parecidas. Cada opción debe tener un nombre distinto."
    }
    if (built.length < OPTIONS_MIN) {
      return `Agrega al menos ${OPTIONS_MIN} opciones con nombres distintos.`
    }
    if (built.length > OPTIONS_MAX) return `Una lista puede tener máximo ${OPTIONS_MAX} opciones.`
    if (built.some((o) => o.label.length > FIELD_LABEL_MAX)) {
      return `Cada opción puede tener máximo ${FIELD_LABEL_MAX} caracteres.`
    }
  }
  return null
}

/** Deja solo datos de campesino permitidos, sin repetir y en el orden de FARMER_FIELDS. Null si hay algo inválido. */
export function parseFarmerFields(values: unknown): FarmerFieldKey[] | null {
  if (!Array.isArray(values)) return null
  const allowed = FARMER_FIELDS.map((f) => f.value) as readonly string[]
  if (values.some((v) => typeof v !== "string" || !allowed.includes(v))) return null
  return FARMER_FIELDS.map((f) => f.value).filter((v) => values.includes(v))
}
