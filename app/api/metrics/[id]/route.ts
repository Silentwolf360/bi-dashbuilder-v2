import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/authorization"
import { metricService } from "@/lib/metric.service"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const metric = await metricService.getMetric(params.id)

    if (!metric) {
      return NextResponse.json(
        { success: false, error: "Metric not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: metric })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    await metricService.deleteMetric(params.id)
    return NextResponse.json({ success: true, message: "Metric deleted" })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
