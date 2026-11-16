"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN, type FarmerSearchResult } from "@/types/requests"
import { searchFarmers } from "../../../../peticiones/actions"

type SearchState = { q: string; results: FarmerSearchResult[]; failed: boolean }

/**
 * Buscador de campesino por cédula o nombre: espera ~300 ms entre teclas, mínimo 3 caracteres,
 * máximo 10 resultados (los limita la base de datos) y sin distinguir tildes.
 */
export default function FarmerSearch({
  formId,
  onSelect,
  disabled = false,
}: {
  formId: number
  onSelect: (farmer: FarmerSearchResult) => void
  disabled?: boolean
}) {
  const [query, setQuery] = useState("")
  const [state, setState] = useState<SearchState | null>(null)
  const latest = useRef(0)

  const q = query.trim()
  const ready = q.length >= SEARCH_MIN

  useEffect(() => {
    if (q.length < SEARCH_MIN) return
    const mine = ++latest.current
    const timer = setTimeout(async () => {
      try {
        const results = await searchFarmers(q)
        if (mine === latest.current) setState({ q, results, failed: false })
      } catch {
        if (mine === latest.current) setState({ q, results: [], failed: true })
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [q])

  // Solo se muestra el resultado de lo que está escrito ahora (nunca el de una búsqueda anterior)
  const current = ready && state?.q === q ? state : null
  const searching = ready && !current

  const isCedula = /^\d{3,10}$/.test(q)
  const registerHref = `/dashboard/campesino/nuevo?${new URLSearchParams({
    ...(isCedula ? { cc: q } : {}),
    volverA: `/dashboard/formularios/${formId}/peticiones/nueva`,
  }).toString()}`

  return (
    <div className="grid gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" aria-hidden />
        <Input
          type="search"
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribe la cédula o el nombre del campesino"
          aria-label="Buscar campesino por cédula o nombre"
          autoComplete="off"
          className="pl-9"
        />
      </div>

      {!ready ? (
        <p className="text-sm text-neutral-600">Escribe al menos {SEARCH_MIN} caracteres para buscar.</p>
      ) : null}
      {searching ? <p className="text-sm text-neutral-600">Buscando...</p> : null}

      {current?.failed ? (
        <p role="alert" className="text-sm text-red-700">
          No se pudo buscar. Inténtalo de nuevo.
        </p>
      ) : null}

      {current && !current.failed && current.results.length > 0 ? (
        <ul className="rounded-md border divide-y">
          {current.results.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(f)}
                className="w-full text-left px-3 py-2 hover:bg-neutral-50 focus-visible:bg-neutral-50 outline-none"
              >
                <span className="block text-sm font-medium text-neutral-900">
                  {f.farmer_name} {f.farmer_last}
                </span>
                <span className="block text-xs text-neutral-600">
                  Cédula {f.farmer_cc}
                  {f.village_name ? ` · Vereda ${f.village_name}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {current && !current.failed && current.results.length === 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 grid gap-2">
          <p className="text-sm text-amber-900">
            {isCedula
              ? `No encontramos la cédula ${q}. ¿La escribiste bien?`
              : `No encontramos a nadie con «${q}». Revisa cómo lo escribiste.`}
          </p>
          <div>
            <Button variant="outline" size="sm" asChild>
              <Link href={registerHref}>Registrar campesino</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
