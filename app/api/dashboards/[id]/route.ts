import { NextRequest, NextResponse } from "next/server"
import { requireAuth, canAccessDashboard } from "@/lib/authorization"
import { dashboardService } from "@/lib/dashboard.service"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    const hasAccess = await canAccessDashboard(user.id, params.id)
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    const dashboard = await dashboardService.getDashboard(params.id, user.id)
    return NextResponse.json({ success: true, data: dashboard })
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
    await dashboardService.deleteDashboard(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
