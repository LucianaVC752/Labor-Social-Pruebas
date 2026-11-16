import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FORM_STATUS_LABEL, type FormStatus } from "@/types/forms"
import { getForm, getProfileNames, getStatusLog } from "../actions"
import { getFormFields } from "./actions"
import FieldsManager from "./fields-manager"
import FinalizeDialog from "./finalize-dialog"
import FormSettings from "./form-settings"
import ListColumnsEditor from "./list-columns"
import StatusActions from "./status-actions"

const STATUS_CLASS: Record<FormStatus, string> = {
  borrador: "bg-amber-100 text-amber-800",
  finalizado: "bg-green-100 text-green-800",
  cerrado: "bg-neutral-200 text-neutral-700",
  archivado: "bg-neutral-200 text-neutral-700",
}

const STATUS_HELP: Record<FormStatus, string> = {
  borrador: "Es un borrador: puedes agregar, cambiar, ordenar y borrar campos libremente.",
  finalizado: "Está finalizado: recibe peticiones y su estructura ya no se puede modificar.",
  cerrado: "Está cerrado: ya no recibe peticiones nuevas, pero se siguen gestionando las existentes.",
  archivado: "Está archivado: fuera de uso. Puedes restaurarlo o duplicarlo.",
}

// Fecha fija en hora de Colombia: el servidor y el navegador muestran lo mismo.
const dateTime = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
})

function Datum({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <span className="text-xs text-neutral-600">{label}</span>
      <span className="text-sm font-medium text-neutral-900">{children}</span>
    </div>
  )
}

export default async function FormEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ finalizado?: string }>
}) {
  const { id } = await params
  const { finalizado } = await searchParams
  const formId = Number(id)
  if (!Number.isInteger(formId) || formId <= 0) notFound()

  const form = await getForm(formId)
  if (!form) notFound()

  const fields = await getFormFields(formId)
  const isDraft = form.status === "borrador"

  // Solo el resumen necesita el historial y los nombres de quien hizo cada cambio
  const log = isDraft ? [] : await getStatusLog(formId)
  const names = isDraft
    ? {}
    : await getProfileNames([form.finalized_by ?? "", ...log.map((l) => l.changed_by ?? "")])
  const who = (userId: string | null) => (userId ? (names[userId] ?? "Un usuario") : "El sistema")

  // La pantalla de datos solo se recrea cuando cambian los datos que muestra:
  // editar campos también actualiza updated_at y no debe borrar lo que se está escribiendo.
  const settingsKey = `${form.name}|${form.description ?? ""}|${form.farmer_fields.join(",")}`

  return (
    <section className="py-8">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-start gap-4 mb-6 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-neutral-800">{form.name}</h1>
              <span className={cn("inline-block rounded px-2 py-0.5 text-xs", STATUS_CLASS[form.status])}>
                {FORM_STATUS_LABEL[form.status]}
              </span>
            </div>
            <p className="text-sm text-neutral-600 mt-1 max-w-prose">{STATUS_HELP[form.status]}</p>
          </div>
          <div className="grid gap-2 justify-items-end">
            <div className="flex gap-2 flex-wrap justify-end">
              <Button variant="outline" asChild>
                <Link href="/dashboard/formularios">Volver a formularios</Link>
              </Button>
              {isDraft ? <FinalizeDialog form={form} fields={fields} /> : null}
            </div>
            {isDraft ? null : <StatusActions form={form} />}
          </div>
        </div>

        {!isDraft && finalizado ? (
          <p
            role="status"
            className="mb-6 text-sm text-green-900 bg-green-50 border border-green-200 rounded px-3 py-2"
          >
            El formulario «{form.name}» quedó finalizado. Su estructura ya no se puede modificar y ya puede recibir
            peticiones.
          </p>
        ) : null}

        <div className="grid gap-8">
          {isDraft ? null : (
            <div className="rounded-md border p-4 grid gap-4">
              <h2 className="text-xl font-semibold text-neutral-800">Resumen</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Datum label="Estado">{FORM_STATUS_LABEL[form.status]}</Datum>
                <Datum label="Campos">{fields.length}</Datum>
                <Datum label="Creado">{dateTime.format(new Date(form.created_at))}</Datum>
                <Datum label="Finalizado">
                  {form.finalized_at
                    ? `${dateTime.format(new Date(form.finalized_at))} · ${who(form.finalized_by)}`
                    : "—"}
                </Datum>
              </div>
            </div>
          )}

          <FormSettings key={settingsKey} form={form} readOnly={!isDraft} />

          {isDraft ? null : (
            <div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-1">Columnas destacadas</h2>
              <p className="text-sm text-neutral-600 mb-3 max-w-prose">
                Campos que se muestran como columnas en la lista de peticiones de este formulario.
              </p>
              <ListColumnsEditor
                formId={form.id}
                fields={fields}
                initial={form.list_columns}
                expectedUpdatedAt={form.updated_at}
                readOnly={form.status === "archivado"}
              />
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold text-neutral-800 mb-3">Campos del formulario</h2>
            <FieldsManager formId={form.id} fields={fields} readOnly={!isDraft} />
          </div>

          {isDraft ? null : (
            <div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-3">Historial de estados</h2>
              {log.length === 0 ? (
                <p className="text-sm text-neutral-600">Aún no hay cambios de estado registrados.</p>
              ) : (
                <ul className="grid gap-1.5 text-sm text-neutral-800">
                  {log.map((l) => (
                    <li key={l.id}>
                      <span className="font-medium">
                        {l.from_status ? `${FORM_STATUS_LABEL[l.from_status]} → ` : ""}
                        {FORM_STATUS_LABEL[l.to_status]}
                      </span>
                      <span className="text-neutral-600">
                        {" "}
                        · {who(l.changed_by)} · {dateTime.format(new Date(l.changed_at))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
