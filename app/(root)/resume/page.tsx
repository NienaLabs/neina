'use client'

import { Button } from '@/components/ui/button'
import { resumeTags } from '@/constants/constant'
import { cn } from '@/lib/utils'
import { MoreHorizontal, Edit, FileDown, Trash2, Star ,Upload} from 'lucide-react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

// ======================
// Types & Mock Data
// ======================
type ResumeData = {
  id: number
  name: string
  score: number
  targetRole: string
  lastModified: string
  createdAt: string
}

const data: ResumeData[] = [
  {
    id: 1,
    name: 'Frontend Developer Resume',
    score: 85,
    targetRole: 'Frontend Engineer',
    lastModified: '2025-11-03',
    createdAt: '2025-09-12',
  },
  {
    id: 2,
    name: 'Backend Developer Resume',
    score: 78,
    targetRole: 'Backend Engineer',
    lastModified: '2025-10-30',
    createdAt: '2025-09-25',
  },
  {
    id: 3,
    name: 'UI/UX Resume',
    score: 92,
    targetRole: 'Product Designer',
    lastModified: '2025-11-01',
    createdAt: '2025-09-20',
  },
]

// ======================
// Columns Definition
// ======================
const columns: ColumnDef<ResumeData>[] = [
  {
    accessorKey: 'name',
    header: 'Resume',
    cell: ({ row }) => {
      const resume = row.original
      return (
        <div className="flex items-center gap-3">
          {/* Score badge */}
          <div className="h-10 w-10 flex items-center justify-center border rounded-full bg-amber-100 text-amber-700 font-semibold">
            {resume.score}%
          </div>

          {/* Name + Status */}
          <div className="flex flex-col">
            <Link
              href={`/dashboard/resumee/edit/${resume.id}`}
              className="font-medium text-gray-900 dark:text-white hover:text-amber-600 transition-colors"
            >
              {resume.name}
            </Link>
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-[10px] w-fit mt-1"
            >
              Analysis complete
            </Badge>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'targetRole',
    header: 'Target Role',
    cell: ({ row }) => (
      <div className="flex items-center justify-between">
        <p className="text-gray-700 dark:text-gray-300 font-medium">
          {row.getValue('targetRole')}
        </p>

        {/* Action Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
              <Edit className="h-4 w-4 text-blue-500" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
              <FileDown className="h-4 w-4 text-amber-500" />
              Export
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
              <Star className="h-4 w-4 text-yellow-500" />
              Set as Primary
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
  {
    accessorKey: 'lastModified',
    header: 'Last Modified',
    cell: ({ row }) => (
      <p className="text-gray-700 dark:text-gray-300">
        {row.getValue('lastModified')}
      </p>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => (
      <p className="text-gray-700 dark:text-gray-300">
        {row.getValue('createdAt')}
      </p>
    ),
  },
]

// ======================
// Page Component
// ======================
const Page = () => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="space-y-8">
      {/* ===================== */}
      {/* Primary Resume Section */}
      {/* ===================== */}
      <div>
        <h1 className="ml-5 font-semibold mb-2">Primary Resume</h1>
        <div className="flex items-center gap-5 rounded-xl bg-white p-4 shadow-lg ring-1 ring-black/5 dark:bg-gray-800">
          {/* Resume Strength Meter */}
          <div className="grid grid-cols-1 relative grid-rows-1">
            <div className="border-4 border-gray-100 dark:border-gray-700 size-20 rounded-full" />
            <div className="border-4 absolute z-2 border-amber-500 mask-conic-from-70% size-20 mask-conic-to-70% rounded-full dark:border-amber-400" />
            <div className="absolute z-3 size-20 rounded-full items-center flex justify-center">
              <h1 className="font-bold text-3xl">B</h1>
            </div>
          </div>

          {/* Resume Details */}
          <div className="w-0 flex-1 text-sm text-gray-950 dark:text-white">
            <p className="font-medium">Resume strength: 70%</p>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Fairly good</p>
          </div>

          {/* Tags */}
          <div className="items-center justify-center flex-col flex gap-3">
            <h1 className="text-center font-semibold">Issues</h1>
            <div className="gap-5 flex flex-row justify-between ml-auto items-center">
              {resumeTags.map((tag: string) => (
                <div
                  key={tag}
                  className={cn(
                    'p-2 rounded-lg border-l-10 ring-1',
                    tag === 'critical'
                      ? 'border-red-200 ring-red-300 bg-red-100'
                      : 'border-green-200 bg-green-100 ring-green-300'
                  )}
                >
                  <p>1 {tag}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Popover for Actions */}
          <div className="mt-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="data-[state=open]:bg-accent h-7 w-7"
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                  <Edit className="h-4 w-4 text-blue-500" />
                  Edit
                </DropdownMenuItem>

                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                  <Upload className="h-4 w-4 text-amber-600" />
                  Upload New Resume
                </DropdownMenuItem>

                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {/* Data Table Section */}
      <Card className="bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/5">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resume Extensions {"(Tailored Resumes)"}
          </h2>

          <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead
                        key={header.id}
                        className="text-gray-700 dark:text-gray-300 font-semibold"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Page
