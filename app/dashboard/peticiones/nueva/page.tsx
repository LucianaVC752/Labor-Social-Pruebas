import Link from "next/link"
import { Button } from "@/components/ui/button"
import { listForms } from "../../formularios/actions"

// Primer paso para registrar una petición: elegir en qué formulario.
export default async function ElegirFormularioPage() {
  const forms = (await listForms()).filter((f) => f.status === "finalizado")

  return (
    <section className="py-8">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex justify-between items-start gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800">Registrar petición</h1>
            <p className="text-sm text-neutral-600 mt-1">Elige el formulario con el que vas a registrar la petición.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Volver al panel</Link>
          </Button>
        </div>

        {forms.length === 0 ? (
          <div className="rounded-md border p-6 text-sm text-neutral-700 grid gap-3">
            <p>Aún no hay formularios finalizados. Finaliza un formulario para empezar a registrar peticiones.</p>
            <div>
              <Button variant="outline" asChild>
                <Link href="/dashboard/formularios">Ir a formularios</Link>
              </Button>
            </div>
          </div>
        ) : (
          <ul className="rounded-md border divide-y">
            {forms.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/dashboard/formularios/${f.id}/peticiones/nueva`}
                  className="block px-4 py-3 hover:bg-neutral-50 focus-visible:bg-neutral-50 outline-none"
                >
                  <span className="block font-medium text-neutral-900">{f.name}</span>
                  {f.description ? <span className="block text-sm text-neutral-600">{f.description}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
