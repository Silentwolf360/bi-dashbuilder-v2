import { NextRequest, NextResponse } from "next/server"
import { requireAuth, getUserDataFilters } from "@/lib/authorization"
import { dashboardService } from "@/lib/dashboard.service"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { filters } = body

    // Apply user data filters
    const userFilters = await getUserDataFilters(user.id)
    const mergedFilters = { ...filters, ...userFilters }

    const data = await dashboardService.executeChartQuery(
      params.id,
      user.id,
      mergedFilters
    )

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
