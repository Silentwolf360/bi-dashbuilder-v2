"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react"

interface SchemaColumn {
  name: string
  type: "string" | "number" | "date" | "boolean"
  nullable: boolean
  isPrimaryKey?: boolean
}

interface UploadResult {
  schema: {
    columns: SchemaColumn[]
    primaryKeys: string[]
  }
  rowCount: number
  sample: any[]
  uploadedFile: {
    filename: string
    path: string
    size: number
  }
}

export default function DataSourceUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dataSourceName, setDataSourceName] = useState("")
  const [tableName, setTableName] = useState("")
  const [creating, setCreating] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      setUploadResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/data-sources/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setUploadResult(result.data)
        if (!dataSourceName) {
          setDataSourceName(file.name.split(".")[0])
        }
        if (!tableName) {
          setTableName(file.name.split(".")[0].toLowerCase().replace(/[^a-z0-9]/g, "_"))
        }
      } else {
        setError(result.error)
      }
    } catch (err: any) {
      setError(err.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleCreateDataSource = async () => {
    if (!uploadResult || !dataSourceName || !tableName) return

    setCreating(true)
    setError(null)

    try {
      const response = await fetch("/api/data-sources/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: dataSourceName,
          tableName,
          filePath: uploadResult.uploadedFile.path,
          schema: uploadResult.schema,
          refreshFrequency: "MANUAL",
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`Data source created successfully with ${uploadResult.rowCount} rows!`)
        // Reset form
        setFile(null)
        setUploadResult(null)
        setDataSourceName("")
        setTableName("")
      } else {
        setError(result.error)
      }
    } catch (err: any) {
      setError(err.message || "Failed to create data source")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Data Source</CardTitle>
          <CardDescription>
            Upload CSV, Excel, or JSON files to create a new data source
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Select File</label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileChange}
                disabled={uploading || creating}
              />
              <Button
                onClick={handleUpload}
                disabled={!file || uploading || creating}
              >
                {uploading ? "Uploading..." : <><Upload className="w-4 h-4 mr-2" /> Upload</>}
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Upload Success */}
          {uploadResult && (
            <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">File uploaded successfully!</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Rows:</span>{" "}
                  <span className="font-medium">{uploadResult.rowCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Columns:</span>{" "}
                  <span className="font-medium">{uploadResult.schema.columns.length}</span>
                </div>
              </div>

              {/* Schema Preview */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Detected Schema:</h4>
                <div className="bg-white rounded border max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Column</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Type</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Nullable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult.schema.columns.map((col, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-2">{col.name}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {col.type}
                            </span>
                          </td>
                          <td className="px-3 py-2">{col.nullable ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sample Data */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Sample Data (first 5 rows):</h4>
                <div className="bg-white rounded border max-h-48 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {uploadResult.schema.columns.map((col, idx) => (
                          <th key={idx} className="px-2 py-2 text-left font-medium text-gray-700">
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult.sample.map((row, idx) => (
                        <tr key={idx} className="border-t">
                          {uploadResult.schema.columns.map((col, colIdx) => (
                            <td key={colIdx} className="px-2 py-2 whitespace-nowrap">
                              {row[col.name]?.toString() || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Source Configuration */}
              <div className="space-y-3 pt-4 border-t">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Data Source Name</label>
                  <Input
                    value={dataSourceName}
                    onChange={(e) => setDataSourceName(e.target.value)}
                    placeholder="My Data Source"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">Table Name</label>
                  <Input
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="my_table"
                  />
                </div>

                <Button
                  onClick={handleCreateDataSource}
                  disabled={!dataSourceName || !tableName || creating}
                  className="w-full"
                >
                  {creating ? "Creating..." : "Create Data Source"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
