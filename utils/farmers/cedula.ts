// Regla de negocio: la cédula solo tiene números, de 3 a 10 dígitos.
// (Las cédulas antiguas son cortas; las nuevas llegan a 10.)
// La base de datos la hace cumplir también (restricción farmers_cc_format).
export const CEDULA_MIN = 3
export const CEDULA_MAX = 10

/** Quita puntos, comas, guiones y espacios: "1.234.567" -> "1234567". */
export function normalizeCedula(input: unknown): string {
  return String(input ?? "").replace(/[\s.,-]/g, "")
}

export type CedulaResult = { ok: true; value: string } | { ok: false; message: string }

export function validateCedula(input: unknown): CedulaResult {
  const value = normalizeCedula(input)
  if (value === "") return { ok: false, message: "La cédula es obligatoria." }
  if (!/^\d+$/.test(value)) {
    return {
      ok: false,
      message: "La cédula solo puede tener números (se ignoran puntos, comas, guiones y espacios).",
    }
  }
  if (value.length < CEDULA_MIN || value.length > CEDULA_MAX) {
    return { ok: false, message: `La cédula debe tener entre ${CEDULA_MIN} y ${CEDULA_MAX} dígitos.` }
  }
  return { ok: true, value }
}
