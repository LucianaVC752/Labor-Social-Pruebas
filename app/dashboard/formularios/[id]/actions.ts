"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { requireUser } from "@/utils/supabase/require-user"
import {
  FORM_STATUS_LABEL,
  MAX_FIELDS,
  type ActionResult,
  type FieldInput,
  type FormField,
  type FormStatus,
} from "@/types/forms"
import { describeConflict, findLabelConflict, uniqueKey } from "@/utils/forms/field-names"
import { moveInList, type MoveAction } from "@/utils/forms/field-order"
import { buildOptions, usesPlaceholder, validateFieldInput } from "@/utils/forms/field-rules"

type Supabase = Awaited<ReturnType<typeof createClient>>
type Sibling = Pick<FormField, "id" | "key" | "label" | "type" | "position">

const FORMS_PATH = "/dashboard/formularios"
const NO_SESSION: ActionResult = { ok: false, message: "Tu sesión expiró. Inicia sesión de nuevo." }
const VILLAGE_TAKEN =
  "Este formulario ya tiene un campo de vereda. Solo se permite uno, para saber cuál usar al planear la ruta."

const refresh = (formId: number) => {
  revalidatePath(`${FORMS_PATH}/${formId}`)
  revalidatePath(FORMS_PATH)
}

// La estructura solo se puede cambiar mientras el formulario es un borrador.
// (La base de datos también lo exige; esto da un mensaje claro antes de llegar ahí.)
async function assertDraft(supabase: Supabase, formId: number): Promise<ActionResult> {
  const { data } = await supabase.from("forms").select("status").eq("id", formId).maybeSingle()
  if (!data) return { ok: false, message: "El formulario ya no existe." }
  const status = (data as { status: FormStatus }).status
  if (status !== "borrador") {
    return {
      ok: false,
      message: `Este formulario está ${FORM_STATUS_LABEL[status].toLowerCase()}: su estructura ya no se puede modificar.`,
    }
  }
  return { ok: true }
}

async function loadField(supabase: Supabase, fieldId: number): Promise<FormField | null> {
  const { data } = await supabase.from("form_fields").select("*").eq("id", fieldId).maybeSingle()
  return (data as unknown as FormField | null) ?? null
}

async function listSiblings(supabase: Supabase, formId: number): Promise<Sibling[] | null> {
  const { data, error } = await supabase
    .from("form_fields")
    .select("id, key, label, type, position")
    .eq("form_id", formId)
    .order("position", { ascending: true })
    .order("id", { ascending: true })
  if (error) return null
  return (data ?? []) as unknown as Sibling[]
}

// Traduce los errores de la base de datos a mensajes claros.
function dbError(error: { code?: string; message: string }): ActionResult {
  switch (error.code) {
    case "23505":
      return { ok: false, message: "Otra persona acaba de crear un campo igual. Recarga la página e inténtalo de nuevo." }
    case "23514":
      return { ok: false, message: "Los datos del campo no son válidos." }
    case "42501":
      return { ok: false, message: "Este formulario ya no está en borrador: su estructura no se puede modificar." }
    default:
      return { ok: false, message: error.message }
  }
}

export async function getFormFields(formId: number): Promise<FormField[]> {
  if (!(await requireUser())) throw new Error("No autenticado")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", formId)
    .order("position", { ascending: true })
    .order("id", { ascending: true })

  if (error) {
    console.error("Error obteniendo campos:", error.message)
    throw new Error("No se pudieron cargar los campos del formulario")
  }
  return (data ?? []) as unknown as FormField[]
}

export async function createField(formId: number, input: FieldInput): Promise<ActionResult> {
  if (!(await requireUser())) return NO_SESSION

  const invalid = validateFieldInput(input)
  if (invalid) return { ok: false, message: invalid }

  const supabase = await createClient()
  const draft = await assertDraft(supabase, formId)
  if (!draft.ok) return draft

  const siblings = await listSiblings(supabase, formId)
  if (!siblings) return { ok: false, message: "No se pudo validar el nombre del campo." }

  if (siblings.length >= MAX_FIELDS) {
    return { ok: false, message: `Se alcanzó el máximo de ${MAX_FIELDS} campos por formulario.` }
  }
  const conflict = findLabelConflict(input.label, siblings)
  if (conflict) return { ok: false, message: describeConflict(input.label, conflict, siblings) }
  if (input.type === "village" && siblings.some((s) => s.type === "village")) {
    return { ok: false, message: VILLAGE_TAKEN }
  }

  const { error } = await supabase.from("form_fields").insert({
    form_id: formId,
    key: uniqueKey(input.label, siblings.map((s) => s.key)),
    label: input.label.trim(),
    type: input.type,
    required: input.required,
    placeholder: usesPlaceholder(input.type) ? input.placeholder.trim() || null : null,
    options: input.type === "select" ? buildOptions(input.options) : null,
    position: Math.max(0, ...siblings.map((s) => s.position)) + 1,
  })
  if (error) return dbError(error)

  refresh(formId)
  return { ok: true }
}

// En borrador se puede cambiar todo, incluido el tipo: todavía no hay peticiones con datos.
export async function updateField(fieldId: number, input: FieldInput): Promise<ActionResult> {
  if (!(await requireUser())) return NO_SESSION

  const invalid = validateFieldInput(input)
  if (invalid) return { ok: false, message: invalid }

  const supabase = await createClient()
  const current = await loadField(supabase, fieldId)
  if (!current) return { ok: false, message: "El campo ya no existe." }
  const draft = await assertDraft(supabase, current.form_id)
  if (!draft.ok) return draft

  const siblings = await listSiblings(supabase, current.form_id)
  if (!siblings) return { ok: false, message: "No se pudo validar el nombre del campo." }

  const conflict = findLabelConflict(input.label, siblings, fieldId)
  if (conflict) {
    return { ok: false, message: describeConflict(input.label, conflict, siblings, { ignoreId: fieldId }) }
  }
  if (input.type === "village" && siblings.some((s) => s.type === "village" && s.id !== fieldId)) {
    return { ok: false, message: VILLAGE_TAKEN }
  }

  const payload: Record<string, unknown> = {
    label: input.label.trim(),
    type: input.type,
    required: input.required,
    placeholder: usesPlaceholder(input.type) ? input.placeholder.trim() || null : null,
    options: input.type === "select" ? buildOptions(input.options) : null,
  }
  // Las reglas (mínimo, máximo...) dependen del tipo: al cambiarlo se reinician
  if (input.type !== current.type) payload.validation = null

  const { data, error } = await supabase.from("form_fields").update(payload).eq("id", fieldId).select("id")
  if (error) return dbError(error)
  if (!data || data.length === 0) {
    return { ok: false, message: "No se pudo guardar: el formulario ya no está en borrador." }
  }

  refresh(current.form_id)
  return { ok: true }
}

// En borrador, eliminar es eliminar de verdad.
export async function deleteField(fieldId: number): Promise<ActionResult> {
  if (!(await requireUser())) return NO_SESSION

  const supabase = await createClient()
  const current = await loadField(supabase, fieldId)
  if (!current) return { ok: false, message: "El campo ya no existe." }
  const draft = await assertDraft(supabase, current.form_id)
  if (!draft.ok) return draft

  const { data, error } = await supabase.from("form_fields").delete().eq("id", fieldId).select("id")
  if (error) return dbError(error)
  if (!data || data.length === 0) {
    return { ok: false, message: "No se pudo eliminar: el formulario ya no está en borrador." }
  }

  refresh(current.form_id)
  return { ok: true }
}

// Los demás campos se acomodan solos y el nuevo orden se guarda en una sola
// operación (función SQL reorder_form_fields), así no queda a medias si algo falla.
export async function moveField(fieldId: number, action: MoveAction): Promise<ActionResult> {
  if (!(await requireUser())) return NO_SESSION

  const supabase = await createClient()
  const current = await loadField(supabase, fieldId)
  if (!current) return { ok: false, message: "El campo ya no existe." }
  const draft = await assertDraft(supabase, current.form_id)
  if (!draft.ok) return draft

  const siblings = await listSiblings(supabase, current.form_id)
  if (!siblings) return { ok: false, message: "No se pudo leer el formulario." }

  const nextIds = moveInList(siblings.map((s) => s.id), fieldId, action)
  if (!nextIds) return { ok: true } // ya estaba en ese extremo

  const { error } = await supabase.rpc("reorder_form_fields", {
    p_form_id: current.form_id,
    p_ids: nextIds,
  })
  if (error) {
    console.error("Error reordenando campos:", error.message)
    if (error.code === "PGRST202") {
      return {
        ok: false,
        message: "Falta crear la función reorder_form_fields en Supabase. Ejecuta el archivo sql/fase-1-formularios.sql.",
      }
    }
    return { ok: false, message: "No se pudo guardar el nuevo orden." }
  }

  refresh(current.form_id)
  return { ok: true }
}
