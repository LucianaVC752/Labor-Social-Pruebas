"use client"
import { DynamicFormModal, FieldConfig } from "@/components/ui/dynamic-form-modal"
import { updateCampesino } from "../actions"
import { Place } from "@/types/village"
import { FarmerEditable } from "@/types/farmers"
import { validateCedula } from "@/utils/farmers/cedula"



interface EditarCampesinoFormProps {
  farmer: Partial<FarmerEditable> | null
  villages: Place[]
}

export default function EditarCampesinoForm({ farmer, villages }: EditarCampesinoFormProps) {
  const fields: FieldConfig[] = [
    { name: "farmer_name", label: "Nombres", type: "text", required: true, placeholder: "Ej: Juan", defaultValue: farmer?.farmer_name ?? "" },
    { name: "farmer_last", label: "Apellidos", type: "text", required: true, placeholder: "Ej: Pérez", defaultValue: farmer?.farmer_last ?? "" },
    {
      name: "farmer_cc", label: "Documento (CC)", type: "text", required: true, placeholder: "Ej: 123456789", defaultValue: farmer?.farmer_cc ?? "",
      validate: (value) => { const r = validateCedula(value); return r.ok ? null : r.message },
    },
    { name: "email", label: "Email", type: "email", placeholder: "juan@correo.com", defaultValue: farmer?.email ?? "" },
    { name: "cellphone", label: "Celular", type: "text", placeholder: "300 123 4567", defaultValue: farmer?.cellphone ?? "" },
    { name: "date_born", label: "Fecha de nacimiento", type: "date", defaultValue: farmer?.date_born ?? "" },
    {
      name: "village",
      label: "Vereda",
      type: "select",
      placeholder: "Selecciona vereda",
      required: true,
      defaultValue: farmer?.village ? String(farmer.village) : "",
      options: villages.map((v) => ({ label: v.description, value: String(v.codigo) }))
    },
    { 
      name: "biological_sex", 
      label: "Sexo del campesino", 
      type: "select", 
      placeholder: "Selecciona sexo", 
      required: true,
      defaultValue: farmer?.biological_sex ?? ""                                ,
      options: [
        { label: "Masculino", value: "M" },
        { label: "Femenino", value: "F" },
      ],
    },
  ]

  const onSubmit = async (values: Record<string, string | number | boolean | null>) => {
    const valuesWithId = {
      ...values,
      id: farmer?.id
    }
    return await updateCampesino(valuesWithId)
  }

  return (
    <DynamicFormModal
      title="Editar Campesino"
      description="Actualiza los datos del campesino"
      fields={fields}
      submitLabel="Guardar"
      onSubmit={onSubmit}
      onCloseRoute="/dashboard/campesino"
      defaultOpen={true}
    />
  )
}
