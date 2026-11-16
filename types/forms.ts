// ---------- Límites ----------
// Máximo de campos por formulario. Si lo cambias, cambia también el 40 del
// trigger en sql/fase-1-formularios.sql.
export const MAX_FIELDS = 40
export const FORM_NAME_MIN = 3
export const FORM_NAME_MAX = 100
export const FORM_DESCRIPTION_MAX = 500
export const FIELD_LABEL_MIN = 2
export const FIELD_LABEL_MAX = 80
export const PLACEHOLDER_MAX = 120
export const OPTIONS_MIN = 2
export const OPTIONS_MAX = 50

// ---------- Campos ----------
export const FIELD_TYPES = [
  { value: "text", label: "Texto corto" },
  { value: "textarea", label: "Texto largo" },
  { value: "number", label: "Número" },
  { value: "date", label: "Fecha" },
  { value: "select", label: "Lista de opciones" },
  { value: "checkbox", label: "Casilla (sí / no)" },
  { value: "village", label: "Vereda" },
] as const

export type FieldType = (typeof FIELD_TYPES)[number]["value"]

// askDetail: al elegir esta opción, quien captura debe escribir una especificación
// (por ejemplo, «Semillas» pide «¿Qué semillas?»).
export type FieldOption = { label: string; value: string; askDetail?: boolean }

// Reglas declarativas (se guardan como JSON). Todavía no se editan desde la pantalla.
export type FieldValidation = {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
}

// Una fila de public.form_fields
export type FormField = {
  id: number
  form_id: number
  key: string
  label: string
  type: FieldType
  required: boolean
  placeholder: string | null
  options: FieldOption[] | null
  validation: FieldValidation | null
  position: number
}

// Lo que envía el diálogo de crear / editar un campo
export type FieldInput = {
  label: string
  type: FieldType
  required: boolean
  placeholder: string
  options: { label: string; askDetail: boolean }[]
}

// ---------- Formularios ----------
export type FormStatus = "borrador" | "finalizado" | "cerrado" | "archivado"

export const FORM_STATUS_LABEL: Record<FormStatus, string> = {
  borrador: "Borrador",
  finalizado: "Finalizado",
  cerrado: "Cerrado",
  archivado: "Archivado",
}

// Datos del campesino que el ingeniero puede mostrar (solo lectura).
// Nombre y cédula se muestran siempre y no están en esta lista.
export const FARMER_FIELDS = [
  { value: "phone", label: "Teléfono / celular" },
  { value: "email", label: "Correo" },
  { value: "village", label: "Vereda donde vive" },
  { value: "age", label: "Edad" },
  { value: "sex", label: "Sexo" },
] as const

export type FarmerFieldKey = (typeof FARMER_FIELDS)[number]["value"]

// Una fila de public.forms
export type FormRecord = {
  id: number
  name: string
  description: string | null
  status: FormStatus
  farmer_fields: FarmerFieldKey[]
  // Claves (key) de hasta MAX_LIST_COLUMNS campos que se muestran como columnas en la lista de peticiones
  list_columns: string[]
  finalized_by: string | null
  finalized_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type FormListItem = FormRecord & { field_count: number }

export type FormInput = {
  name: string
  description: string
  farmer_fields: FarmerFieldKey[]
}

// ---------- Resultado de las Server Actions ----------
// code: código de error de la base de datos cuando ayuda a la pantalla a decidir qué mostrar
// (por ejemplo "40001": otra persona modificó el formulario).
export type ActionResult = { ok: true; id?: number } | { ok: false; message: string; code?: string }

// ---------- Ciclo de vida del formulario (fase 2) ----------
export const MAX_LIST_COLUMNS = 3

// Transiciones válidas. La base de datos también las hace cumplir.
// Borrador -> finalizado no va por aquí: se hace con «Finalizar formulario».
export const FORM_TRANSITIONS: Record<FormStatus, FormStatus[]> = {
  borrador: ["finalizado"],
  finalizado: ["cerrado", "archivado", "borrador"],
  cerrado: ["finalizado", "archivado"],
  archivado: ["cerrado"],
}

// Una fila de public.form_status_log
export type FormStatusLogRow = {
  id: number
  form_id: number
  from_status: FormStatus | null
  to_status: FormStatus
  changed_by: string | null
  changed_at: string
}
