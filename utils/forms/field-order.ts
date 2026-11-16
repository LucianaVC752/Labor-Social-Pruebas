export type MoveAction = "top" | "up" | "down" | "bottom"

/**
 * Devuelve la lista de ids con `id` movido según la acción, o null si no hay
 * nada que hacer (no existe, o ya está en el límite). Los demás campos se
 * recorren solos: no hace falta calcular posiciones a mano.
 *
 *   moveInList([a, b, c, d], c, "top")  ->  [c, a, b, d]
 *   moveInList([a, b, c, d], b, "down") ->  [a, c, b, d]
 */
export function moveInList(ids: number[], id: number, action: MoveAction): number[] | null {
  const from = ids.indexOf(id)
  if (from === -1) return null

  const to =
    action === "top" ? 0 : action === "bottom" ? ids.length - 1 : action === "up" ? from - 1 : from + 1
  if (to < 0 || to >= ids.length || to === from) return null

  const next = ids.filter((x) => x !== id)
  next.splice(to, 0, id)
  return next
}
