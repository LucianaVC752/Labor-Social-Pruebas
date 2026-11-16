import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FORM_STATUS_LABEL, type FormField } from "@/types/forms"
import type { Place } from "@/types/village"
import { getVillages } from "../../../../campesino/actions"
import { loadFarmerForRequest } from "../../../../peticiones/actions"
import { getForm } from "../../../actions"
import { getFormFields } from "../../actions"
import RequestForm from "./request-form"

export default async function NuevaPeticionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ farmer?: string }>
}) {
  const { id } = await params
  const { farmer } = await searchParams
  const formId = Number(id)
  if (!Number.isInteger(formId) || formId <= 0) notFound()

  const form = await getForm(formId)
  if (!form) notFound()

  const accepting = form.status === "finalizado"

  // Al volver de «Registrar campesino», el campesino nuevo llega en ?farmer= y queda seleccionado
  const farmerId = Number(farmer)
  let fields: FormField[] = []
  let villages: Place[] = []
  let initial: Awaited<ReturnType<typeof loadFarmerForRequest>> = null
  if (accepting) {
    ;[fields, villages, initial] = await Promise.all([
      getFormFields(formId),
      getVillages(),
      Number.isInteger(farmerId) && farmerId > 0 ? loadFarmerForRequest(farmerId, formId) : Promise.resolve(null),
    ])
  }

  return (
    <section className="py-8">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex justify-between items-start gap-4 mb-6 flex-wrap">
          <div>
            <p className="text-sm text-neutral-600">Nueva petición</p>
            <h1 className="text-3xl font-bold text-neutral-800">{form.name}</h1>
            {form.description ? <p className="text-sm text-neutral-600 mt-1 max-w-prose">{form.description}</p> : null}
          </div>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/formularios/${form.id}`}>Volver al formulario</Link>
          </Button>
        </div>

        {accepting ? (
          <RequestForm form={form} fields={fields} villages={villages} initial={initial} />
        ) : (
          <p role="alert" className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded px-4 py-3">
            Este formulario está {FORM_STATUS_LABEL[form.status].toLowerCase()} y no recibe peticiones nuevas.
          </p>
        )}
      </div>
    </section>
  )
}
