"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { requireUser } from "@/utils/supabase/require-user"
import {
  FORM_NAME_MAX,
  FORM_STATUS_LABEL,
  MAX_LIST_COLUMNS,
  type ActionResult,
  type FormInput,
  type FormListItem,
  type FormRecord,
  type FormStatus,
  type FormStatusLogRow,
} from "@/types/forms"
import { describeConflict, findLabelConflict, normalizeName, type Named } from "@/utils/forms/field-names"
import {
  parseFarmerFields,
  validateFormDescription,
  validateFormName,
} from "@/utils/forms/field-rules"

type Supabase = Awaited<ReturnType<typeof createClient>>

const LIST_PATH = "/dashboard/formularios"
const NO_SESSION: ActionResult = { ok: false, message: "Tu sesión expiró. Inicia sesión de nuevo." }
const CONFLICT_MESSAGE =
  "Otra persona modificó el formulario mientras lo revisabas. Recarga la página e inténtalo de nuevo."

// Códigos con los que las funciones de la base de datos (fase 2) devuelven mensajes ya escritos
// para la persona: 28000 sin sesión, P0002 no existe, 40001 modificado por otra persona,
// 55000 estado o transición no permitidos, 23514 datos no válidos, 23505 nombre repetido.
const SHOWN_CODES = new Set(["28000", "P0002", "40001", "55000", "23514", "23505"])

function rpcError(error: { code?: string; message: string }): ActionResult {
  if (error.code && SHOWN_CODES.has(error.code)) {
    return { ok: false, message: error.message, code: error.code }
  }
  console.error("Error en la base de datos:", error.code, error.message)
  return { ok: false, message: "No se pudo completar la acción. Inténtalo de nuevo.", code: error.code }
}

const refresh = (id?: number) => {
  revalidatePath(LIST_PATH)
  if (id) revalidatePath(`${LIST_PATH}/${id}`)
}

// Los nombres de formularios se comparan como "elementos con nombre" (id + label).
async function listNames(supabase: Supabase): Promise<Named[] | null> {
  const { data, error } = await supabase.from("forms").select("id, name")
  if (error) return null
  return (data as unknown as { id: number; name: string }[]).map((f) => ({ id: f.id, label: f.name }))
}

async function getStatus(supabase: Supabase, id: number): Promise<FormStatus | null> {
  const { data } = await supabase.from("forms").select("status").eq("id", id).maybeSingle()
  return data ? ((data as { status: FormStatus }).status) : null
}

export async function listForms(): Promise<FormListItem[]> {
  if (!(await requireUser())) throw new Error("No autenticado")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("forms")
    .select("id, name, description, status, farmer_fields, list_columns, finalized_by, finalized_at, created_by, created_at, updated_at, form_fields(count)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error obteniendo formularios:", error.message)
    throw new Error("No se pudieron cargar los formularios")
  }

  const rows = (data ?? []) as unknown as (FormRecord & { form_fields: { count: number }[] | null })[]
  return rows.map(({ form_fields, ...form }) => ({ ...form, field_count: form_fields?.[0]?.count ?? 0 }))
}

export async function getForm(id: number): Promise<FormRecord | null> {
  if (!(await requireUser())) throw new Error("No autenticado")

  const supabase = await createClient()
  const { data, error } = await supabase.from("forms").select("*").eq("id", id).maybeSingle()
  if (error) {
    console.error("Error obteniendo el formulario:", error.message)
    throw new Error("No se pudo cargar el formulario")
  }
  return (data as unknown as FormRecord | null) ?? null
}

export async function createForm(input: { name: string; description: string }): Promise<ActionResult> {
  if (!(await requireUser())) return NO_SESSION

  const name = input.name.trim()
  const description = input.description.trim()
  const invalid = validateFormName(name) ?? validateFormDescription(description)
  if (invalid) return { ok: false, message: invalid }

  const supabase = await createClient()
  const names = await listNames(supabase)
  if (!names) return { ok: false, message: "No se pudo validar el nombre del formulario." }

  const conflict = findLabelConflict(name, names)
  if (conflict) {
    return {
      ok: false,
      message: describeConflict(name, conflict, names, { noun: "un formulario", maxLength: FORM_NAME_MAX }),
    }
  }

  const { data, error } = await supabase
    .from("forms")
    .insert({ name, description: description || null })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Otra persona acaba de crear un formulario con ese nombre. Inténtalo de nuevo." }
    }
    return { ok: false, message: error.message }
  }

  revalidatePath(LIST_PATH)
  return { ok: true, id: (data as unknown as { id: number }).id }
}

// expectedUpdatedAt: el updated_at que vio quien edita (texto tal cual lo devolvió la base de datos).
// Si otra persona guardó mientras tanto, no se pisa su cambio.
export async function updateForm(
  id: number,
  input: FormInput,
  expectedUpdatedAt?: string
): Promise<ActionResult> {
  if (!(await requireUser())) return NO_SESSION

  const supabase = await createClient()
  const status = await getStatus(supabase, id)
  if (!status) return { ok: false, message: "El formulario ya no existe." }
  if (status !== "borrador") {
    return { ok: false, message: `Este formulario está ${FORM_STATUS_LABEL[status].toLowerCase()} y ya no se puede modificar.` }
  }

  const name = input.name.trim()
  const description = input.description.trim()
  const invalid = validateFormName(name) ?? validateFormDescription(description)
  if (invalid) return { ok: false, message: invalid }

  const farmerFields = parseFarmerFields(input.farmer_fields)
  if (!farmerFields) return { ok: false, message: "Los datos del campesino elegidos no son válidos." }

  const names = await listNames(supabase)
  if (!names) return { ok: false, message: "No se pudo validar el nombre del formulario." }
  const conflict = findLabelConflict(name, names, id)
  if (conflict) {
    return {
      ok: false,
      message: describeConflict(name, conflict, names, { ignoreId: id, noun: "un formulario", maxLength: FORM_NAME_MAX }),
    }
  }

  let update = supabase
    .from("forms")
    .update({ name, description: description || null, farmer_fields: farmerFields })
    .eq("id", id)
  if (expectedUpdatedAt) update = update.eq("updated_at", expectedUpdatedAt)
  const { data, error } = await update.select("id")

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Otra persona acaba de usar ese nombre. Recarga la página e inténtalo de nuevo." }
    }
    return { ok: false, message: error.message }
  }
  if (!data || data.length === 0) {
    return expectedUpdatedAt
      ? { ok: false, message: CONFLICT_MESSAGE, code: "40001" }
      : { ok: false, message: "No se pudo guardar: el formulario ya no está en borrador." }
  }

  revalidatePath(LIST_PATH)
  revalidatePath(`${LIST_PATH}/${id}`)
  return { ok: true }
}

// Solo se eliminan borradores: no tienen peticiones. Sus campos se eliminan con él.
export async function deleteForm(id: number): Promise<ActionResult> {
  if (!(await requireUser())) return NO_SESSION

  const supabase = await createClient()
  const status = await getStatus(supabase, id)
  if (!status) return { ok: false, message: "El formulario ya no existe." }
  if (status !== "borrador") {
    return { ok: false, message: "Solo se pueden eliminar borradores. Un formulario finalizado se archiva." }
  }

  const { data, error } = await supabase.from("forms").delete().eq("id", id).select("id")
  if (error) return { ok: false, message: error.message }
  if (!data || data.length === 0) {
    return { ok: false, message: "No se pudo eliminar: el formulario ya no está en borrador." }
  }

  revalidatePath(LIST_PATH)
  return { ok: true }
}

/* ---------- Fase 2: finalizar, cambiar de estado y duplicar ---------- */

const INVALID_FORM: ActionResult = { ok: false, message: "Formulario no válido." }

function parseListColumns(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  if (value.some((k) => typeof k !== "string")) return null
  const keys = value as string[]
  if (new Set(keys).size !== keys.length || keys.length > MAX_LIST_COLUMNS) return null
  return keys
}

// Finaliza un borrador: todo o nada. La base de datos valida que tenga al menos 1 campo,
// que las columnas destacadas existan y que nadie lo haya modificado mientras tanto.
export async function finalizeForm(
  id: number,
  input: { expectedUpdatedAt: string; confirmName: string; listColumns: string[] }
): Promise<ActionResult> {
  if (!(await requireUser())) return NO_SESSION
  if (!Number.isInteger(id) || id <= 0) return INVALID_FORM
  if (typeof input.expectedUpdatedAt !== "string" || !input.expectedUpdatedAt) return INVALID_FORM

  const listColumns = parseListColumns(input.listColumns)
  if (!listColumns) {
    return { ok: false, message: `Elige hasta ${MAX_LIST_COLUMNS} columnas destacadas, sin repetir.` }
  }

  const supabase = await createClient()
  const { data } = await supabase.from("forms").select("name").eq("id", id).maybeSingle()
  if (!data) return { ok: false, message: "El formulario ya no existe." }
  const name = (data as { name: string }).name

  // Confirmación: quien finaliza debe reescribir el nombre (sin distinguir tildes, mayúsculas ni espacios de más)
  if (normalizeName(String(input.confirmName ?? "")) !== normalizeName(name)) {
    return { ok: false, message: "El nombre escrito no coincide con el del formulario." }
  }

  const { error } = await supabase.rpc("finalize_form", {
    p_form_id: id,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_list_columns: listColumns,
  })
  if (error) return rpcError(error)

  refresh(id)
  return { ok: true }
}

// Cerrar, reabrir, archivar, restaurar y volver a borrador. La base de datos valida la transición.
export async function setFormStatus(
  id: number,
  status: FormStatus,
  expectedUpdatedAt?: string
): Promise<ActionResult> {
  if (!(await requireUser())) return NO_SESSION
  if (!Number.isInteger(id) || id <= 0) return INVALID_FORM
  if (!Object.prototype.hasOwnProperty.call(FORM_STATUS_LABEL, status)) {
    return { ok: false, message: "El estado no es válido." }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("set_form_status", {
    p_form_id: id,
    p_status: status,
    p_expected_updated_at: expectedUpdatedAt ?? null,
  })
  if (error) return rpcError(error)

  refresh(id)
  return { ok: true }
}

// Cambia las columnas destacadas de un formulario finalizado o cerrado.
export async function setListColumns(
  id: number,
  listColumns: string[],
  expectedUpdatedAt?: string
): Promise<ActionResult> {
  if (!(await requireUser())) return NO_SESSION
  if (!Number.isInteger(id) || id <= 0) return INVALID_FORM
  const keys = parseListColumns(listColumns)
  if (!keys) return { ok: false, message: `Elige hasta ${MAX_LIST_COLUMNS} columnas destacadas, sin repetir.` }

  const supabase = await createClient()
  const { error } = await supabase.rpc("set_form_list_columns", {
    p_form_id: id,
    p_list_columns: keys,
    p_expected_updated_at: expectedUpdatedAt ?? null,
  })
  if (error) return rpcError(error)

  refresh(id)
  return { ok: true }
}

// Crea un borrador nuevo con los mismos campos. Devuelve el id del nuevo formulario.
export async function duplicateForm(id: number): Promise<ActionResult> {
  if (!(await requireUser())) return NO_SESSION
  if (!Number.isInteger(id) || id <= 0) return INVALID_FORM

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("duplicate_form", { p_form_id: id })
  if (error) return rpcError(error)

  refresh()
  return { ok: true, id: Number(data) }
}

/* ---------- Fase 2: historial y nombres ---------- */

export async function getStatusLog(formId: number): Promise<FormStatusLogRow[]> {
  if (!(await requireUser())) throw new Error("No autenticado")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("form_status_log")
    .select("id, form_id, from_status, to_status, changed_by, changed_at")
    .eq("form_id", formId)
    .order("changed_at", { ascending: false })
    .limit(20)

  if (error) {
    console.error("Error obteniendo el historial:", error.message)
    return []
  }
  return (data ?? []) as unknown as FormStatusLogRow[]
}

// Nombres para mostrar «quién». Si no hay perfil o no se puede leer, simplemente no hay nombre.
export async function getProfileNames(userIds: string[]): Promise<Record<string, string>> {
  if (!(await requireUser())) throw new Error("No autenticado")
  const ids = Array.from(new Set(userIds.filter(Boolean)))
  if (ids.length === 0) return {}

  const supabase = await createClient()
  const { data, error } = await supabase.from("profiles").select("user_id, nombre").in("user_id", ids)
  if (error || !data) return {}

  const names: Record<string, string> = {}
  for (const row of data as { user_id: string | null; nombre: string | null }[]) {
    if (row.user_id && row.nombre) names[row.user_id] = row.nombre
  }
  return names
}
