"use client"
import { DynamicFormModal, FieldConfig } from "@/components/ui/dynamic-form-modal"
import { createCampesino } from "../actions"
import { Place } from "@/types/village"
import { validateCedula } from "@/utils/farmers/cedula"

interface NuevoCampesinoFormProps {
  villages: Place[]
  defaultCc?: string
  // Pantalla de captura de petición a la que se vuelve (ya validada como ruta interna)
  returnTo?: string | null
}

export default function NuevoCampesinoForm({ villages, defaultCc = "", returnTo = null }: NuevoCampesinoFormProps) { 
  
  const fields: FieldConfig[] = [
    { name: "farmer_name", label: "Nombres", type: "text", required: true, placeholder: "Ej: Juan" },
    { name: "farmer_last", label: "Apellidos", type: "text", required: true, placeholder: "Ej: Pérez" },
    {
      name: "farmer_cc", label: "Documento (CC)", type: "text", required: true, placeholder: "Ej: 123456789",
      defaultValue: defaultCc,
      validate: (value) => { const r = validateCedula(value); return r.ok ? null : r.message },
    },
    { name: "email", label: "Email", type: "email", placeholder: "juan@correo.com" },
    { name: "cellphone", label: "Celular", type: "text", placeholder: "300 123 4567" },
    { name: "date_born", label: "Fecha de nacimiento", type: "date" },
    { 
      name: "village", 
      label: "Vereda", 
      type: "select", 
      placeholder: "Selecciona vereda", 
      required: true,
      options: villages.map((village) => ({ 
        label: village.description, 
        value: String(village.codigo) 
      }))
    },
    { 
      name: "biological_sex", 
      label: "Sexo del campesino", 
      type: "select", 
      placeholder: "Selecciona sexo", 
      required: true,
      options: [
        { label: "Masculino", value: "M" },
        { label: "Femenino", value: "F" },
      ]
    },

  ]

  const onSubmit = async (values: Record<string, string | number | boolean | null>) => {
    // Quién crea el registro lo decide el servidor a partir de la sesión
    return await createCampesino(values)
  }

  return (
    <DynamicFormModal
      title="Crear Campesino"
      description="Completa los datos del nuevo campesino"
      fields={fields}
      submitLabel="Crear"
      onSubmit={onSubmit}
      onCloseRoute={returnTo ?? "/dashboard/campesino"}
      onSuccessRoute={({ id }) => (returnTo && id ? `${returnTo}?farmer=${id}` : undefined)}
      defaultOpen={true}
    />
  )
}
