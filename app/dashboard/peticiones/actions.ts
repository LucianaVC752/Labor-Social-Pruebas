"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { requireUser } from "@/utils/supabase/require-user"
import { validateAnswers } from "@/utils/requests/validate-answers"
import { FORM_STATUS_LABEL, type FormField, type FormStatus } from "@/types/forms"
import {
  OPEN_REQUEST_STATUSES,
  SEARCH_MIN,
  type CreateRequestResult,
  type FarmerCard,
  type FarmerSearchResult,
  type RequestCounts,
} from "@/types/requests"

const NO_SESSION = { ok: false as const, message: "Tu sesión expiró. Inicia sesión de nuevo." }

// Códigos con los que create_request devuelve mensajes ya escritos para la persona:
// 28000 sin sesión, P0002 no existe, 55000 formulario sin captura, 23514 datos no válidos.
const SHOWN_CODES = new Set(["28000", "P0002", "55000", "23514"])

const isId = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n > 0

/** Busca campesinos por cédula o nombre (mínimo 3 caracteres, máximo 10 resultados, sin tildes). */
export async function searchFarmers(query: string): Promise<FarmerSearchResult[]> {
  if (!(await requireUser())) throw new Error("No autenticado")

  const q = String(query ?? "").trim().slice(0, 100)
  if (q.length < SEARCH_MIN) return []

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("search_farmers", { p_query: q })
  if (error) {
    console.error("Error buscando campesinos:", error.message)
    throw new Error("No se pudo buscar")
  }
  return (data ?? []) as unknown as FarmerSearchResult[]
}

/**
 * Datos del campesino para la captura, y cuántas peticiones abiertas tiene ya en este formulario
 * (solo se usa para avisar; no bloquea).
 */
export async function loadFarmerForRequest(
  farmerId: number,
  formId: number
): Promise<{ farmer: FarmerCard; openRequests: number } | null> {
  if (!(await requireUser())) throw new Error("No autenticado")
  if (!isId(farmerId) || !isId(formId)) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from("vistaCampesino")
    .select("id, farmer_cc, full_name, village, cellphone, email, edad, sexo")
    .eq("id", farmerId)
    .maybeSingle()
  if (!data) return null

  const row = data as unknown as {
    id: number
    farmer_cc: string | null
    full_name: string | null
    village: string | null
    cellphone: string | null
    email: string | null
    edad: number | null
    sexo: string | null
  }

  const { count } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("farmer_id", farmerId)
    .eq("form_id", formId)
    .in("status", [...OPEN_REQUEST_STATUSES])

  return {
    farmer: {
      id: row.id,
      farmer_cc: row.farmer_cc ?? "",
      full_name: row.full_name ?? "",
      village: row.village,
      phone: row.cellphone,
      email: row.email,
      age: row.edad,
      sex: row.sexo,
    },
    openRequests: count ?? 0,
  }
}

/** Cuántas peticiones tiene un formulario (para el resumen). */
export async function getRequestCounts(formId: number): Promise<RequestCounts> {
  if (!(await requireUser())) throw new Error("No autenticado")
  if (!isId(formId)) return { total: 0, open: 0 }

  const supabase = await createClient()
  const [total, open] = await Promise.all([
    supabase.from("requests").select("id", { count: "exact", head: true }).eq("form_id", formId),
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("form_id", formId)
      .in("status", [...OPEN_REQUEST_STATUSES]),
  ])
  return { total: total.count ?? 0, open: open.count ?? 0 }
}

/**
 * Registra una petición. Las respuestas se validan aquí contra la estructura congelada del
 * formulario; la base de datos vuelve a comprobar lo esencial y asigna el código consecutivo.
 */
export async function createRequest(
  formId: number,
  farmerId: number,
  rawAnswers: Record<string, unknown>
): Promise<CreateRequestResult> {
  if (!(await requireUser())) return NO_SESSION
  if (!isId(formId) || !isId(farmerId)) return { ok: false, message: "Datos no válidos." }
  if (!rawAnswers || typeof rawAnswers !== "object" || Array.isArray(rawAnswers)) {
    return { ok: false, message: "Las respuestas no son válidas." }
  }

  const supabase = await createClient()

  const { data: form } = await supabase.from("forms").select("status").eq("id", formId).maybeSingle()
  if (!form) return { ok: false, message: "El formulario ya no existe." }
  const status = (form as { status: FormStatus }).status
  if (status !== "finalizado") {
    return {
      ok: false,
      message: `Este formulario está ${FORM_STATUS_LABEL[status].toLowerCase()} y no recibe peticiones nuevas.`,
    }
  }

  const { data: fieldRows, error: fieldsError } = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", formId)
    .order("position", { ascending: true })
    .order("id", { ascending: true })
  if (fieldsError) return { ok: false, message: "No se pudo leer la estructura del formulario." }
  const fields = (fieldRows ?? []) as unknown as FormField[]

  const { data: villageRows } = await supabase.from("village").select("codigo")
  const villageCodes = ((villageRows ?? []) as unknown as { codigo: number }[]).map((v) => v.codigo)

  const check = validateAnswers(fields, rawAnswers, villageCodes)
  if (!check.ok) {
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors: check.errors }
  }

  const { data, error } = await supabase.rpc("create_request", {
    p_form_id: formId,
    p_farmer_id: farmerId,
    p_answers: check.answers,
  })
  if (error) {
    if (error.code && SHOWN_CODES.has(error.code)) return { ok: false, message: error.message }
    console.error("Error registrando la petición:", error.code, error.message)
    return { ok: false, message: "No se pudo registrar la petición. Inténtalo de nuevo." }
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | { request_id: number; request_code: string }
    | null
    | undefined
  if (!row) return { ok: false, message: "No se pudo registrar la petición. Inténtalo de nuevo." }

  revalidatePath(`/dashboard/formularios/${formId}`)
  return { ok: true, id: Number(row.request_id), code: row.request_code }
}
