import Link from "next/link"
import { format } from "date-fns"
import {prisma} from "@/prisma"
import { HardHat, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface RecentReportsProps {
  userId: string
  limit?: number
}

export async function RecentReports({ userId, limit = 5 }: RecentReportsProps) {
  const reports = await prisma.yolo_results.findMany({
    where: {
      site: {
        userId,
      },
    },
    include: {
      site: true,
      spot_location: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  })

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <HardHat className="h-10 w-10 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No safety reports yet</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Start by creating your first safety report</p>
        <Button asChild>
          <Link href="/form">Create Safety Report</Link>
        </Button>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Site</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Violations</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => {
          const totalViolations = report.helmets + report.vests

          return (
            <TableRow key={report.id}>
              <TableCell className="font-medium">{format(new Date(report.createdAt), "MMM d, yyyy")}</TableCell>
              <TableCell>{report.site.name}</TableCell>
              <TableCell>{report.spot_location.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {totalViolations > 0 ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <Badge variant="destructive">{totalViolations} violations</Badge>
                    </>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      No violations
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/reports/${report.id}`}>View Details</Link>
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
