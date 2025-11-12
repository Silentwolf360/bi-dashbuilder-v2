import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/authorization"
import { dataSourceService } from "@/lib/data-source.service"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const dataSource = await dataSourceService.getDataSource(params.id)

    if (!dataSource) {
      return NextResponse.json(
        { success: false, error: "Data source not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: dataSource,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    await dataSourceService.deleteDataSource(params.id)

    return NextResponse.json({
      success: true,
      message: "Data source deleted successfully",
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
