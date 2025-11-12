import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/authorization"
import { dataSourceService } from "@/lib/data-source.service"
import { z } from "zod"

const finalizeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  tableName: z.string().min(1),
  filePath: z.string(),
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const validated = finalizeSchema.parse(body)

    // Create data source
    const dataSource = await dataSourceService.createDataSource({
      name: validated.name,
      description: validated.description,
      type: "FILE_UPLOAD",
      schema: validated.schema,
      refreshFrequency: validated.refreshFrequency,
      incrementalField: validated.incrementalField,
    })

    // Parse uploaded file
    const fileExt = validated.filePath.split(".").pop()?.toLowerCase()
    let fileType: "csv" | "excel" | "json" = "csv"
    
    if (["xlsx", "xls"].includes(fileExt || "")) {
      fileType = "excel"
    } else if (fileExt === "json") {
      fileType = "json"
    }

    let data: any[] = []
    if (fileType === "csv") {
      data = await dataSourceService["parseCSV"](validated.filePath)
    } else if (fileType === "excel") {
      data = await dataSourceService["parseExcel"](validated.filePath)
    } else if (fileType === "json") {
      data = await dataSourceService["parseJSON"](validated.filePath)
    }

    // Create table and insert data
    await dataSourceService.createDataTable(
      dataSource.id,
      validated.tableName,
      validated.schema,
      data
    )

    return NextResponse.json({
      success: true,
      data: dataSource,
      message: `Data source created with ${data.length} rows`,
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
      { status: 500 }
    )
  }
}
