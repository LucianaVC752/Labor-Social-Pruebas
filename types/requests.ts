// ---------- Peticiones (fase 3) ----------
export type RequestStatus = "pendiente" | "en_proceso" | "atendida" | "rechazada" | "anulada"

// Una petición «abierta» todavía se está gestionando
export const OPEN_REQUEST_STATUSES = ["pendiente", "en_proceso"] as const

// Especificación de una opción de lista que la pide (por ejemplo, «Semillas» -> «¿Qué semillas?»)
export const DETAIL_MIN = 3
export const DETAIL_MAX = 300

// Límites de texto de las respuestas (la base de datos limita el total a 100.000 caracteres)
export const TEXT_MAX = 500
export const TEXTAREA_MAX = 2000

// Buscador de campesinos
export const SEARCH_MIN = 3
export const SEARCH_DEBOUNCE_MS = 300

// Cómo se guarda cada respuesta en requests.answers (por la clave del campo):
//  - lista:   { value, detail? }   (detail solo si la opción pide especificación)
//  - vereda:  código numérico de la vereda
//  - número:  number · casilla: boolean · texto y fecha: string
export type SelectAnswer = { value: string; detail?: string }
export type AnswerValue = string | number | boolean | SelectAnswer
export type Answers = Record<string, AnswerValue>

// Una fila de la función search_farmers
export type FarmerSearchResult = {
  id: number
  farmer_cc: string
  farmer_name: string
  farmer_last: string
  village_code: number | null
  village_name: string | null
}

// Datos del campesino que se muestran al capturar (solo lectura)
export type FarmerCard = {
  id: number
  farmer_cc: string
  full_name: string
  village: string | null
  phone: string | null
  email: string | null
  age: number | null
  sex: string | null
}

export type CreateRequestResult =
  | { ok: true; id: number; code: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

export type RequestCounts = { total: number; open: number }
