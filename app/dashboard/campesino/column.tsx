"use client"

import  { ColumnDef, type CellContext } from '@tanstack/react-table'
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import DataTableColumnHeader from "@/components/ui/data-table-column-header"
import { VistaCampesino } from '@/types/farmers'
import Link from 'next/link'

// types/farmer.ts



    
export const columns: ColumnDef<VistaCampesino>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'farmer_cc',
    header: 'Cédula',
  },
  {
    accessorKey: 'full_name',
    header: ({ column }) => {
      return (
        <DataTableColumnHeader column={column} title="Nombre Completo" />
      )
    },
  },
  {
    accessorKey: 'cellphone',
    header: 'Teléfono',
  },
  {
    accessorKey: 'edad',
    //header: 'Edad',
    header: ({ column }) => {
      return (
        <DataTableColumnHeader column={column} title="Edad" />
      )
    },
  },{
    accessorKey: 'date_born',
    header: 'Fecha Nacimiento',
  },
  {
    accessorKey: 'village',
    header: 'Vereda',
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const farmer = row.original
 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir Menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(farmer.farmer_cc)}
            >
              Copiar Cédula
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/campesino/vista/${farmer.id}`}>
                Ver Campesino
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/campesino/editar/${farmer.id}`}>
                Editar Campesino
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }
]
