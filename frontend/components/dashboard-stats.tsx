import {prisma} from "@/prisma"
interface DashboardStatsProps {
  type: "sites" | "reports" | "violations"
  userId: string
}

export async function DashboardStats({ type, userId }: DashboardStatsProps) {
  let count = 0
  let label = ""
  let trend = 0

  switch (type) {
    case "sites":
      count = await prisma.site.count({
        where: { userId },
      })
      label = "Total Sites"
      break
    case "reports":
      count = await prisma.yolo_results.count({
        where: {
          site: {
            userId,
          },
        },
      })
      label = "Total Reports"
      break
    case "violations":
      // Sum all helmets and vests violations
      const violations = await prisma.yolo_results.aggregate({
        where: {
          site: {
            userId,
          },
        },
        _sum: {
          helmets: true,
          vests: true,
        },
      })

      count = (violations._sum.helmets || 0) + (violations._sum.vests || 0)
      label = "Total Violations"

      // Calculate trend (example: compare with last month)
      const lastMonthDate = new Date()
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1)

      const lastMonthViolations = await prisma.yolo_results.aggregate({
        where: {
          site: {
            userId,
          },
          createdAt: {
            lt: new Date(),
            gte: lastMonthDate,
          },
        },
        _sum: {
          helmets: true,
          vests: true,
        },
      })

      const lastMonthTotal = (lastMonthViolations._sum.helmets || 0) + (lastMonthViolations._sum.vests || 0)
      if (lastMonthTotal > 0) {
        trend = Math.round(((count - lastMonthTotal) / lastMonthTotal) * 100)
      }
      break
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="text-2xl font-bold">{count}</div>
      <p className="text-xs text-muted-foreground">
        {trend !== 0 && (
          <span className={trend > 0 ? "text-destructive" : "text-green-500"}>
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
        )}
        {trend !== 0 ? " from last month" : ""}
      </p>
    </div>
  )
}
