import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/authorization"
import { dataSourceService } from "@/lib/data-source.service"
import { fileUploadService } from "@/lib/file-upload.service"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const formData = await request.formData()
    
    const file = formData.get("file") as File
    const dataSourceId = formData.get("dataSourceId") as string
    const tableName = formData.get("tableName") as string
    const mode = formData.get("mode") as string // 'create' or 'append'

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ["csv", "xlsx", "xls", "json"]
    if (!fileUploadService.validateFileType(file, allowedTypes)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Allowed: CSV, Excel, JSON" },
        { status: 400 }
      )
    }

    // Validate file size (50MB max)
    if (!fileUploadService.validateFileSize(file, 50)) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size: 50MB" },
        { status: 400 }
      )
    }

    // Save file
    const uploadedFile = await fileUploadService.saveFile(file, "data-sources")
    const fileType = fileUploadService.getFileTypeCategory(uploadedFile.filename)

    if (fileType === "unknown") {
      return NextResponse.json(
        { success: false, error: "Unsupported file format" },
        { status: 400 }
      )
    }

    // Detect schema
    const schema = await dataSourceService.detectSchemaFromFile(
      uploadedFile.path,
      fileType
    )

    // Parse data
    let data: any[] = []
    if (fileType === "csv") {
      data = await dataSourceService["parseCSV"](uploadedFile.path)
    } else if (fileType === "excel") {
      data = await dataSourceService["parseExcel"](uploadedFile.path)
    } else if (fileType === "json") {
      data = await dataSourceService["parseJSON"](uploadedFile.path)
    }

    if (mode === "append" && dataSourceId && tableName) {
      // Append to existing table
      await dataSourceService.appendData(dataSourceId, tableName, data)
      
      return NextResponse.json({
        success: true,
        message: `Appended ${data.length} rows to ${tableName}`,
        rowsAdded: data.length,
      })
    } else {
      // Return schema for review
      return NextResponse.json({
        success: true,
        data: {
          schema,
          rowCount: data.length,
          sample: data.slice(0, 5),
          uploadedFile: {
            filename: uploadedFile.filename,
            path: uploadedFile.path,
            size: uploadedFile.size,
          },
        },
      })
    }
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
