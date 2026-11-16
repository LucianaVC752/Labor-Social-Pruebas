import { login } from './actions'
import LoginSubmit from './LoginSubmit'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const redirectTo = (params?.redirectTo as string) || ''
  const locked = Boolean(params?.locked)
  const until = params?.until as string | undefined
  const error = Boolean(params?.error)
  const remaining = (params?.remaining as string | undefined) || ''
  const expired = Boolean(params?.expired)
  return (
    <div className="max-w-md mx-auto p-6 rounded-lg border shadow-sm bg-white/70">
      <h1 className="text-xl font-semibold mb-2">Inicio de sesión</h1>
      <p className="text-xs text-neutral-700 mb-4">
        Acceso restringido: Las cuentas son creadas exclusivamente por el equipo administrativo.
      </p>
      {locked && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          Demasiados intentos fallidos. Intenta nuevamente después de {until ? new Date(Number(until)).toLocaleTimeString() : '15 minutos'}.
        </div>
      )}
      {error && !locked && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          Credenciales inválidas. Intentos restantes: {remaining || '0'}.
        </div>
      )}
      {expired && (
        <div className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          La sesión ha expirado. Inicia sesión nuevamente.
        </div>
      )}
      {/* Login */}
      <form action={login} className="space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" name="email" type="email" required className="border rounded px-3 py-2" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
          <input id="password" name="password" type="password" required className="border rounded px-3 py-2" />
        </div>
        <div className="flex items-center gap-2">
          {/* Botón con feedback de carga */}
          <LoginSubmit />
        </div>
      </form>
      {/* No hay registro público. Las credenciales son asignadas vía base de datos administrativa. */}
    </div>
  )
}
