import { createClient } from "@/utils/supabase/server"

/**
 * Devuelve el id del usuario autenticado, o null si no hay sesión.
 *
 * Todas las Server Actions nuevas llaman a esta función. Hoy todos los
 * usuarios autorizados por la alcaldía tienen los mismos permisos; si algún
 * día se agregan roles, este es el único lugar que hay que cambiar.
 */
export async function requireUser(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}
