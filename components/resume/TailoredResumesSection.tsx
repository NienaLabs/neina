'use client'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Edit, Star, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { trpc } from '@/trpc/client'
import { Resume } from '@/lib/generated/prisma/client'
import { toast } from 'sonner'

type ScoreData = {
  scores: {
    overallScore: number
  }
  roleMatch: {
    matchPercentage: number
  }
}

type TailoredResume = Resume & {
  scoreData: ScoreData | null
}

const TailoredResumesSection = ({
  tailoredResumes,
}: {
  tailoredResumes: TailoredResume[] | undefined
}) => {
  
  const utils = trpc.useUtils()

  const setPrimaryMutation = trpc.resume.setPrimary.useMutation({
    onSuccess: () => {
      utils.resume.getPrimaryResumes.invalidate()
      utils.resume.getTailoredResumes.invalidate()
      toast.success("Primary resume set successfully")
    },
  })

  const deleteResumeMutation = trpc.resume.delete.useMutation({
    onSuccess: () => {
      utils.resume.getPrimaryResumes.invalidate()
      utils.resume.getTailoredResumes.invalidate()
      toast.success("Resume deleted successfully")
    },
  })

  const columns: ColumnDef<TailoredResume>[] = [
    {
      accessorKey: 'name',
      header: 'Tailored Version',
      cell: ({ row }) => (
        <Link
          href={`/resume/edit/${row.original.id}`}
          className="font-semibold text-gray-800 dark:text-white hover:text-blue-600 transition-colors"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Target Role',
      cell: ({ row }) => (
        <span className="text-gray-600 dark:text-gray-300">
          {row.original.role}
        </span>
      ),
    },
    {
      accessorKey: 'scoreData',
      header: 'Match Score',
      cell: ({ row }) => {
        const scoreData =
          typeof row.original.scoreData === 'string'
            ? (JSON.parse(row.original.scoreData) as ScoreData)
            : row.original.scoreData
        const score = scoreData?.roleMatch?.matchPercentage
        return (
          <div className="flex items-center gap-2 font-medium">
            {score !== undefined && score !== null ? (
              <>
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    score > 90
                      ? 'bg-green-500'
                      : score > 80
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  )}
                />
                <span>{score}%</span>
              </>
            ) : (
              <span className="text-gray-500">N/A</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Date Created',
      cell: ({ row }) => (
        <span className="text-gray-600 dark:text-gray-300">
          {format(new Date(row.original.createdAt), 'MMM dd, yyyy')}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setPrimaryMutation.mutate({ resumeId: row.original.id })}
              >
                <Star className="mr-2 h-4 w-4" />
                Set as Primary
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-500"
                onClick={() => deleteResumeMutation.mutate({ resumeId: row.original.id })}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: tailoredResumes || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Tailored Resumes</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Versions of your resume tailored for specific job applications.
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="font-bold">
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
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20"
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
                    No tailored resumes found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
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
  )
}

export default TailoredResumesSection
