"use client"
import * as React from "react"
import { DataTablePagination } from "@/components/ui/pagination"

import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
  getPaginationRowModel,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  async function exportSelectedOrAll() {
    const selected = table.getSelectedRowModel().rows.map((r) => r.original as Record<string, unknown>)
    const fallback = table.getFilteredRowModel().rows.map((r) => r.original as Record<string, unknown>)
    const rows = selected.length > 0 ? selected : fallback
    if (!rows.length) return

    const keys = Array.from(
      new Set(
        rows.reduce<string[]>((acc, obj) => {
          acc.push(...Object.keys(obj))
          return acc
        }, [])
      )
    )

    try {
      const XLSX = await import("xlsx")
      const normalized = rows.map((r) => {
        const o: Record<string, unknown> = {}
        for (const k of keys) o[k] = (r as Record<string, unknown>)[k]
        return o
      })
      const ws = XLSX.utils.json_to_sheet(normalized, { header: keys })
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Campesinos")
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
      XLSX.writeFile(wb, `campesinos-${timestamp}.xlsx`)
    } catch {
      const csv = toCSV(rows, keys)
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
      downloadFile(`campesinos-${timestamp}.csv`, csv, "text/csv;charset=utf-8")
    }
  }

  function toCSV(rows: Record<string, unknown>[], headers: string[]) {
    const escape = (val: unknown) => {
      if (val === null || val === undefined) return ""
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }
    const headerLine = headers.join(",")
    const lines = rows.map((row) => headers.map((h) => escape((row as Record<string, unknown>)[h])).join(","))
    return [headerLine, ...lines].join("\r\n")
  }

  function downloadFile(filename: string, content: string, mime: string) {
    const blob = new Blob(["\uFEFF" + content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <>
    {/** Table */}

    <div>
      <div className="flex items-center justify-between py-4 gap-3">
        <Input
          placeholder="Filtrar cedula"
          value={(table.getColumn("farmer_cc")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("farmer_cc")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button variant="outline" onClick={exportSelectedOrAll}>
          Exportar Excel
        </Button>
      </div>
    </div>

    <div>
      <div className="text-muted-foreground flex-1 text-sm">
      {table.getFilteredSelectedRowModel().rows.length} of{" "}
      {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
    </div>

    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    {/** Pagination */}
    <DataTablePagination table={table} />
    </>
  )
}
