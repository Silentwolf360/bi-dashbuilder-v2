import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/authorization"
import { metricService } from "@/lib/metric.service"
import { z } from "zod"

const createMetricSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["SIMPLE", "CALCULATED", "TIME_INTEL"]),
  expression: z.string().min(1),
  dataSourceId: z.string().optional(),
  format: z.string().optional(),
  decimalPlaces: z.number().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  aggregation: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const dataSourceId = searchParams.get("dataSourceId")
    const type = searchParams.get("type")
    const isActive = searchParams.get("isActive")

    const filters: any = {}
    if (dataSourceId) filters.dataSourceId = dataSourceId
    if (type) filters.type = type
    if (isActive !== null) filters.isActive = isActive === "true"

    const metrics = await metricService.listMetrics(filters)

    return NextResponse.json({ success: true, data: metrics })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await request.json()
    const validated = createMetricSchema.parse(body)

    // Validate expression
    const validation = metricService.validateExpression(validated.expression)
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid expression", details: validation.errors },
        { status: 400 }
      )
    }

    const metric = await metricService.createMetric(validated)

    return NextResponse.json({ success: true, data: metric })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
