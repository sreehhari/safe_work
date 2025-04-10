import type React from "react"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/prisma"
import { format } from "date-fns"
import Link from "next/link"
import { ArrowLeft, Building, Calendar, HardHat, MapPin, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export default async function ReportDetailsPage({ params }: { params: { id: string } }) {
  const session = await auth()

  if (!session?.user) {
    return notFound()
  }

  const report = await prisma.yolo_results.findUnique({
    where: {
      id: params.id,
    },
    include: {
      site: true,
      spot_location: true,
    },
  })

  if (!report || report.site.userId !== session.user.id) {
    return notFound()
  }

  const totalViolations = report.helmets + report.vests
  const severity = totalViolations === 0 ? "low" : totalViolations < 3 ? "medium" : "high"
  const severityColor = {
    low: "bg-green-50 text-green-700 border-green-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    high: "bg-red-50 text-red-700 border-red-200",
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Safety Report Details</h1>
            <Badge className={severityColor[severity]}>
              {severity.charAt(0).toUpperCase() + severity.slice(1)} Risk
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Report from {format(new Date(report.createdAt), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
              <CardDescription>Details about the construction site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building className="h-4 w-4 mr-2" />
                  <span>Site Name</span>
                </div>
                <p className="font-medium">{report.site.name}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Site Location</span>
                </div>
                <p className="font-medium">{report.site.location}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <HardHat className="h-4 w-4 mr-2" />
                  <span>Camera Location</span>
                </div>
                <p className="font-medium">{report.spot_location.name}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Report Date</span>
                </div>
                <p className="font-medium">{format(new Date(report.createdAt), "MMMM d, yyyy")}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Safety Violations</CardTitle>
              <CardDescription>Detected safety gear violations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ViolationCard title="Missing Helmets" count={report.helmets} icon={HardHat} />
                <ViolationCard title="Missing Safety Vests" count={report.vests} icon={AlertTriangle} />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Summary</h3>
                <p>
                  {totalViolations === 0
                    ? "No safety violations were detected in this report. All workers are properly equipped with helmets and safety vests."
                    : `This report detected a total of ${totalViolations} safety violations. ${report.helmets} workers were missing helmets and ${report.vests} workers were missing safety vests.`}
                </p>

                <div className="pt-2">
                  <h4 className="text-sm font-medium mb-2">Recommended Actions:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {totalViolations === 0 ? (
                      <li>Continue maintaining excellent safety standards</li>
                    ) : (
                      <>
                        <li>Address the safety violations immediately</li>
                        <li>Conduct a safety briefing with all workers</li>
                        <li>Ensure proper safety gear is available to all personnel</li>
                        <li>Schedule a follow-up inspection</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ViolationCard({
  title,
  count,
  icon: Icon,
}: {
  title: string
  count: number
  icon: React.ElementType
}) {
  const isZero = count === 0
  const bgColor = isZero ? "bg-green-50" : "bg-red-50"
  const textColor = isZero ? "text-green-700" : "text-red-700"
  const borderColor = isZero ? "border-green-200" : "border-red-200"
  const iconColor = isZero ? "text-green-500" : "text-red-500"

  return (
    <div className={`flex items-center p-4 border rounded-lg ${bgColor} ${borderColor}`}>
      <div className={`rounded-full p-3 ${bgColor} ${iconColor} mr-4`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className={`text-2xl font-bold ${textColor}`}>{count}</p>
      </div>
    </div>
  )
}
