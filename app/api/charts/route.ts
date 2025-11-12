import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/authorization"
import { dashboardService } from "@/lib/dashboard.service"
import { z } from "zod"

const createChartSchema = z.object({
  pageId: z.string(),
  name: z.string().min(1),
  type: z.enum([
    "LINE", "BAR", "AREA", "PIE", "DONUT", "SCATTER", "BUBBLE",
    "TABLE", "PIVOT", "KPI_CARD", "MAP", "COMBO", "WATERFALL",
    "FUNNEL", "GAUGE", "HEATMAP"
  ]),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  config: z.any(),
  query: z.any(),
  metricIds: z.array(z.string()),
  visibility: z.any().optional(),
})

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await request.json()
    const validated = createChartSchema.parse(body)

    const { metricIds, ...chartData } = validated
    const chart = await dashboardService.addChart(chartData)
    
    if (metricIds.length > 0) {
      await dashboardService.linkMetricsToChart(chart.id, metricIds)
    }

    return NextResponse.json({ success: true, data: chart })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
