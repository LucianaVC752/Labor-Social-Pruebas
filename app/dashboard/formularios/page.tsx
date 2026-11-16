import { listForms } from "./actions"
import FormsManager from "./forms-manager"

export default async function FormulariosPage() {
  const forms = await listForms()

  return (
    <section className="py-8">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-800">Formularios</h1>
          <p className="text-sm text-neutral-600 mt-1 max-w-prose">
            Diseña los formularios con los que se registran las peticiones de los campesinos.
          </p>
        </div>

        <FormsManager forms={forms} />
      </div>
    </section>
  )
}
