import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/authorization"
import { dataSourceService } from "@/lib/data-source.service"
import { z } from "zod"

const createDataSourceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["FILE_UPLOAD", "SQL_DATABASE", "CLOUD", "MANUAL"]),
  connectionConfig: z.any().optional(),
  schema: z.object({
    columns: z.array(
      z.object({
        name: z.string(),
        type: z.enum(["string", "number", "date", "boolean"]),
        nullable: z.boolean(),
        isPrimaryKey: z.boolean().optional(),
      })
    ),
    primaryKeys: z.array(z.string()),
  }),
  refreshFrequency: z.enum(["MANUAL", "HOURLY", "DAILY", "WEEKLY"]).optional(),
  incrementalField: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const isActive = searchParams.get("isActive")

    const filters: any = {}
    if (type) filters.type = type
    if (isActive !== null) filters.isActive = isActive === "true"

    const dataSources = await dataSourceService.listDataSources(filters)

    return NextResponse.json({
      success: true,
      data: dataSources,
    })
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

    const validated = createDataSourceSchema.parse(body)

    const dataSource = await dataSourceService.createDataSource(validated)

    return NextResponse.json({
      success: true,
      data: dataSource,
    })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    )
  }
}
