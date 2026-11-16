import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { VistaCampesino } from '@/types/farmers'
import { normalizeCedula } from '@/utils/farmers/cedula'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export default async function getUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  return user?.id 
}

export async function getCampesinos(
  searchTerm?: string
): Promise<VistaCampesino[]> {
  const supabase = await createClient()

  let query = supabase
    .from('vistaCampesino')  // Usas la vista en lugar de la tabla
    .select('*')
    .order('full_name', { ascending: true })

  // Filtrado opcional por búsqueda.
  // Se quitan los caracteres que rompen el filtro (comas, paréntesis, comillas...) porque
  // el texto se inserta dentro de la expresión .or(...).
  const term = (searchTerm ?? '').replace(/[,()"\\*]/g, ' ').trim()
  if (term) {
    const conditions = [
      `farmer_name.ilike.%${term}%`,
      `farmer_last.ilike.%${term}%`,
      `farmer_cc.ilike.%${term}%`,
    ]
    // "1.234.567" también debe encontrar la cédula guardada como 1234567
    const digits = normalizeCedula(term)
    if (/^\d+$/.test(digits) && digits !== term) conditions.push(`farmer_cc.ilike.%${digits}%`)
    query = query.or(conditions.join(','))
  }
  const { data, error } = await query

  if (error) {
    console.error('Error obteniendo campesinos:', error.message)
    throw new Error('No se pudieron cargar los campesinos')
  }
  return data ?? []
}