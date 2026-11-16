"use server"

import { createClient } from "@/utils/supabase/server"
import { requireUser } from "@/utils/supabase/require-user"
import { validateCedula } from "@/utils/farmers/cedula"
import { revalidatePath } from "next/cache"
import { Place } from "@/types/village"

const NO_SESSION = { ok: false as const, message: "Tu sesión expiró. Inicia sesión de nuevo." }
const CEDULA_REPETIDA = "La cédula ya existe en la base de datos, por favor verifique."
const CEDULA_INVALIDA = "La cédula debe tener solo números, de 3 a 10 dígitos."

// Datos obligatorios de la base de datos, con el nombre que ve la persona
const REQUIRED_COLUMN_LABEL: Record<string, string> = {
  farmer_name: "los nombres",
  farmer_last: "los apellidos",
  date_born: "la fecha de nacimiento",
  village: "la vereda",
  biological_sex: "el sexo",
  cellphone: "el celular",
}

// Error 23502 (dato obligatorio vacío): dice cuál falta en lugar de mostrar el texto técnico.
function missingRequired(message: string): string {
  const column = /column "([^"]+)"/.exec(message)?.[1]
  const label = column ? REQUIRED_COLUMN_LABEL[column] : undefined
  return label ? `Falta ${label}.` : "Falta un dato obligatorio del campesino."
}

// Texto limpio: nunca devuelve "undefined" ni "null" escritos como texto.
const text = (v: unknown) => (v == null ? "" : String(v).trim())

export async function createCampesino(values: Record<string, unknown>) {
  // Quién crea el registro sale de la sesión del servidor, no de lo que mande el navegador.
  const userId = await requireUser()
  if (!userId) return NO_SESSION

  const cc = validateCedula(values.farmer_cc)
  if (!cc.ok) return { ok: false, message: cc.message }

  const supabase = await createClient()

  // Verificar si la cédula ya existe
  const { data: existingFarmers } = await supabase
    .from("farmers")
    .select("farmer_cc")
    .eq("farmer_cc", cc.value)

  if (existingFarmers && existingFarmers.length > 0) {
    return { ok: false, message: CEDULA_REPETIDA }
  }

  const payload = {
    biological_sex: text(values.biological_sex),
    farmer_cc: cc.value,
    farmer_name: text(values.farmer_name),
    farmer_last: text(values.farmer_last),
    date_born: text(values.date_born) || null,
    cellphone: text(values.cellphone),
    email: text(values.email),
    photo: null,
    farmer_signature: null,
    village: text(values.village),
    created_by: userId,
  }

  const { data, error } = await supabase.from("farmers").insert(payload).select("id").single()

  if (error) {
    if (error.code === "23505") { // Código de error de Postgres para violación de unicidad
      return { ok: false, message: "La cédula ya existe en la base de datos." }
    }
    if (error.code === "23514") return { ok: false, message: CEDULA_INVALIDA } // restricción farmers_cc_format
    if (error.code === "23502") return { ok: false, message: missingRequired(error.message) }
    return { ok: false, message: error.message }
  }

  revalidatePath("/dashboard/campesino")
  // El id permite volver a la captura de una petición con este campesino ya seleccionado
  return { ok: true, id: Number((data as { id: number }).id) }
}

export async function updateCampesino(values: Record<string, unknown>) {
  if (!(await requireUser())) return NO_SESSION

  const id = Number(values.id)
  if (!Number.isInteger(id) || id <= 0) return { ok: false, message: "Campesino no válido." }

  const cc = validateCedula(values.farmer_cc)
  if (!cc.ok) return { ok: false, message: cc.message }

  const supabase = await createClient()

  // Verificar si la cédula ya existe, excluyendo al usuario actual
  const { data: existingFarmers } = await supabase
    .from("farmers")
    .select("id")
    .eq("farmer_cc", cc.value)
    .neq("id", id) // Excluir el ID actual

  if (existingFarmers && existingFarmers.length > 0) {
    return { ok: false, message: CEDULA_REPETIDA }
  }

  const payload = {
    farmer_name: text(values.farmer_name),
    farmer_last: text(values.farmer_last),
    farmer_cc: cc.value,
    email: text(values.email) || null,
    cellphone: text(values.cellphone) || null,
    date_born: text(values.date_born) || null,
    village: text(values.village) || null,
    biological_sex: text(values.biological_sex) || null,
  }

  const { error } = await supabase.from("farmers").update(payload).eq("id", id)

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "La cédula ya existe en la base de datos." }
    }
    if (error.code === "23514") return { ok: false, message: CEDULA_INVALIDA }
    return { ok: false, message: error.message }
  }

  revalidatePath("/dashboard/campesino")
  return { ok: true }
}

export async function getFarmer(id: string) {
  const supabase = await createClient()
  const n = Number(id)
  if (Number.isNaN(n)) return null
  const { data, error } = await supabase
    .from("farmers")
    .select("*")
    .eq("id", n)
    .single()
  if (error) return null
  return data
}

export async function getVillages(): Promise<Place[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("village")
    .select("codigo, description")
    .order("description", { ascending: true })
  if (error) return []
  return data ?? []
}
