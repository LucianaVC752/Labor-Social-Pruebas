export type Named = { id: number; label: string }

/**
 * Forma comparable de un nombre: sin tildes, sin mayúsculas, sin signos y
 * con un solo espacio entre palabras. "  Teléfono  " y "telefono" dan lo mismo.
 */
export function normalizeName(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

/** "Tipo de solicitud" -> "tipo_de_solicitud" (máximo 40 caracteres). */
export function slugify(text: string): string {
  return normalizeName(text).replace(/ /g, "_").slice(0, 40).replace(/_+$/, "")
}

/**
 * Busca otro elemento (campo o formulario) con el mismo nombre.
 * ignoreId sirve al editar: un elemento no entra en conflicto consigo mismo.
 */
export function findLabelConflict<T extends Named>(
  label: string,
  items: T[],
  ignoreId?: number
): T | undefined {
  const wanted = normalizeName(label)
  return items.find((f) => f.id !== ignoreId && normalizeName(f.label) === wanted)
}

/** Primer nombre libre de la forma "Celular 2", "Celular 3"... */
export function suggestLabel(
  label: string,
  items: Named[],
  ignoreId?: number,
  maxLength = 80
): string {
  const base = label.trim()
  for (let n = 2; ; n++) {
    const suffix = ` ${n}`
    const candidate = base.slice(0, maxLength - suffix.length).trimEnd() + suffix
    if (!findLabelConflict(candidate, items, ignoreId)) return candidate
  }
}

export function describeConflict(
  label: string,
  conflict: Named,
  items: Named[],
  options: { ignoreId?: number; noun?: string; maxLength?: number } = {}
): string {
  const { ignoreId, noun = "un campo", maxLength = 80 } = options
  const suggestion = suggestLabel(label, items, ignoreId, maxLength)
  return `Ya existe ${noun} llamado "${conflict.label}". Usa otro nombre, por ejemplo "${suggestion}".`
}

/**
 * Clave interna libre. Como la clave nunca cambia pero la etiqueta sí, puede
 * pasar que "celular" ya sea la clave de un campo que hoy se llama distinto.
 * En ese caso se agrega un sufijo: celular_2.
 */
export function uniqueKey(label: string, takenKeys: string[]): string {
  const base = slugify(label)
  const taken = new Set(takenKeys)
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) {
    const suffix = `_${n}`
    const candidate = base.slice(0, 40 - suffix.length).replace(/_+$/, "") + suffix
    if (!taken.has(candidate)) return candidate
  }
}
