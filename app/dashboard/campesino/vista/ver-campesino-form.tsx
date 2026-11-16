"use client"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import Image from "next/image"
import { FarmerView } from "@/types/farmers"
import Link from "next/link"

export default function VerCampesinoForm({ farmer }: { farmer: FarmerView }) {
  return (
    <section className="py-8">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">Información del Campesino</h1>
          <Button variant="outline" asChild>
            <Link href="/dashboard/campesino">Volver</Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-[160px_1fr] items-start">
          <div className="flex items-center justify-center border rounded-md bg-neutral-50 h-[160px] w-[160px] overflow-hidden">
            {farmer.photo ? (
              <Image src={farmer.photo} alt="Foto" width={160} height={160} className="object-cover" />
            ) : (
              <User className="h-16 w-16 text-neutral-400" />
            )}
          </div>

          <div className="grid gap-3">
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Cédula" value={farmer.farmer_cc} />
              <Field label="Nombre" value={farmer.farmer_name} />
              <Field label="Apellido" value={farmer.farmer_last} />
              <Field label="Sexo" value={farmer.biological_sex === "M" ? "Masculino" : farmer.biological_sex === "F" ? "Femenino" : ""} />
              <Field label="Nombre Completo" value={farmer.full_name ?? `${farmer.farmer_name} ${farmer.farmer_last}`} />
              <Field label="Fecha Nacimiento" value={farmer.date_born ?? ""} />
              <Field label="Vereda" value={farmer.village ?? ""} />
              <Field label="Celular" value={farmer.cellphone ?? ""} />
              <Field label="Email" value={farmer.email ?? ""} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-xs text-neutral-600">{label}</span>
      <span className="text-sm font-medium text-neutral-900 border rounded-md px-3 py-2 bg-white/60">
        {value || "—"}
      </span>
    </div>
  )
}
