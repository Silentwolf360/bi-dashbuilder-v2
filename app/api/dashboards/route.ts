import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/authorization"
import { dashboardService } from "@/lib/dashboard.service"
import { z } from "zod"

const createDashboardSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  layout: z.any().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const dashboards = await dashboardService.listDashboardsForUser(user.id)
    return NextResponse.json({ success: true, data: dashboards })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const validated = createDashboardSchema.parse(body)
    const dashboard = await dashboardService.createDashboard(validated, user.id)
    return NextResponse.json({ success: true, data: dashboard })
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
