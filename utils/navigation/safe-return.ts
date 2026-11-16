// Ruta de retorno aceptada al registrar un campesino desde la captura de una petición.
// Solo se admite esa pantalla exacta: así nadie puede mandar a la persona a otro sitio con un enlace armado.
const ALLOWED = /^\/dashboard\/formularios\/\d{1,9}\/peticiones\/nueva$/

export function safeReturnPath(value: unknown): string | null {
  return typeof value === "string" && ALLOWED.test(value) ? value : null
}
