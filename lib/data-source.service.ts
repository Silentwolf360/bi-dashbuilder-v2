import prisma from "./prisma"
import { DataSourceType, RefreshFrequency } from "@prisma/client"
import * as XLSX from "xlsx"
import Papa from "papaparse"

export interface ColumnDefinition {
  name: string
  type: "string" | "number" | "date" | "boolean"
  nullable: boolean
  isPrimaryKey?: boolean
}

export interface DataSourceSchema {
  columns: ColumnDefinition[]
  primaryKeys: string[]
}

export class DataSourceService {
  /**
   * Create a new data source
   */
  async createDataSource(data: {
    name: string
    description?: string
    type: DataSourceType
    connectionConfig?: any
    schema: DataSourceSchema
    refreshFrequency?: RefreshFrequency
    incrementalField?: string
  }) {
    try {
      return await prisma.dataSource.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          connectionConfig: data.connectionConfig,
          schema: data.schema,
          refreshFrequency: data.refreshFrequency || "MANUAL",
          incrementalField: data.incrementalField,
          isActive: true,
        },
      })
    } catch (error: any) {
      // If the name already exists, return the existing DataSource instead of failing.
      // Prisma unique constraint errors have code 'P2002'.
      if (error?.code === "P2002") {
        const existing = await prisma.dataSource.findUnique({ where: { name: data.name } })
        if (existing) return existing
      }
      throw error
    }
  }

  /**
   * Auto-detect schema from uploaded file
   */
  async detectSchemaFromFile(
    filePath: string,
    fileType: "csv" | "excel" | "json"
  ): Promise<DataSourceSchema> {
    let data: any[] = []

    if (fileType === "csv") {
      data = await this.parseCSV(filePath)
    } else if (fileType === "excel") {
      data = await this.parseExcel(filePath)
    } else if (fileType === "json") {
      data = await this.parseJSON(filePath)
    }

    return this.inferSchema(data)
  }

  /**
   * Parse CSV file
   */
  private async parseCSV(filePath: string): Promise<any[]> {
    const fs = await import("fs/promises")
    const content = await fs.readFile(filePath, "utf-8")

    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error),
      })
    })
  }

  /**
   * Parse Excel file
   */
  private async parseExcel(filePath: string): Promise<any[]> {
    const workbook = XLSX.readFile(filePath)
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    return XLSX.utils.sheet_to_json(firstSheet)
  }

  /**
   * Parse JSON file
   */
  private async parseJSON(filePath: string): Promise<any[]> {
    const fs = await import("fs/promises")
    const content = await fs.readFile(filePath, "utf-8")
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed : [parsed]
  }

  /**
   * Infer schema from data sample
   */
  private inferSchema(data: any[]): DataSourceSchema {
    if (!data || data.length === 0) {
      throw new Error("No data to infer schema from")
    }

    const sample = data.slice(0, 100) // Use first 100 rows
    const columns: ColumnDefinition[] = []
    const keys = Object.keys(sample[0])

    for (const key of keys) {
      const values = sample.map((row) => row[key]).filter((v) => v != null)
      
      const type = this.inferColumnType(values)
      const nullable = values.length < sample.length

      columns.push({
        name: key,
        type,
        nullable,
        isPrimaryKey: false,
      })
    }

    return {
      columns,
      primaryKeys: [],
    }
  }

  /**
   * Infer column type from values
   */
  private inferColumnType(values: any[]): "string" | "number" | "date" | "boolean" {
    if (values.length === 0) return "string"

    const sample = values.slice(0, 50)
    
    // Check if all values are boolean
    if (sample.every((v) => typeof v === "boolean")) {
      return "boolean"
    }

    // Check if all values are numbers
    if (sample.every((v) => typeof v === "number" && !isNaN(v))) {
      return "number"
    }

    // Check if all values are dates
    const dateCount = sample.filter((v) => {
      const date = new Date(v)
      return date instanceof Date && !isNaN(date.getTime())
    }).length

    if (dateCount / sample.length > 0.8) {
      return "date"
    }

    return "string"
  }

  /**
   * Validate uploaded data against schema
   */
  validateDataAgainstSchema(data: any[], schema: DataSourceSchema): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    const schemaColumns = new Set(schema.columns.map((c) => c.name))
    const dataColumns = new Set(Object.keys(data[0] || {}))

    // Check for missing columns
    for (const col of schema.columns) {
      if (!col.nullable && !dataColumns.has(col.name)) {
        errors.push(`Missing required column: ${col.name}`)
      }
    }

    // Check for extra columns
    for (const col of Array.from(dataColumns)) {
      if (!schemaColumns.has(col)) {
        errors.push(`Unexpected column: ${col}`)
      }
    }

    // Validate data types (sample check)
    const sample = data.slice(0, 100)
    for (const col of schema.columns) {
      for (let i = 0; i < sample.length; i++) {
        const value = sample[i][col.name]
        
        if (value == null) {
          if (!col.nullable) {
            errors.push(`Null value in non-nullable column ${col.name} at row ${i + 1}`)
          }
          continue
        }

        if (!this.isValidType(value, col.type)) {
          errors.push(
            `Invalid type for column ${col.name} at row ${i + 1}: expected ${col.type}`
          )
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  private isValidType(value: any, type: string): boolean {
    switch (type) {
      case "number":
        return typeof value === "number" && !isNaN(value)
      case "boolean":
        return typeof value === "boolean"
      case "date":
        return !isNaN(new Date(value).getTime())
      case "string":
        return typeof value === "string"
      default:
        return true
    }
  }

  /**
   * Create or update data table with physical table in database
   */
  async createDataTable(
    dataSourceId: string,
    tableName: string,
    schema: DataSourceSchema,
    data: any[]
  ) {
    // Create physical table using raw SQL
    const physicalName = `ds_${dataSourceId.substring(0, 8)}_${tableName}`
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .toLowerCase()

    // Build CREATE TABLE statement (MySQL-compatible)
    const columnDefs = schema.columns.map((col) => {
      const sqlType = this.getSQLType(col.type)
      const nullable = col.nullable ? "NULL" : "NOT NULL"
      // Use backticks for identifiers in MySQL
      return `\`${col.name}\` ${sqlType} ${nullable}`
    })

    const primaryKey = schema.primaryKeys.length > 0
      ? `, PRIMARY KEY (${schema.primaryKeys.map((k) => `\`${k}\``).join(", ")})`
      : ""

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS \`${physicalName}\` (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        ${columnDefs.join(",\n        ")}
        ${primaryKey}
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `

    await prisma.$executeRawUnsafe(createTableSQL)

    // Insert data
    if (data.length > 0) {
      await this.insertData(physicalName, schema, data)
    }

    // Create or update DataTable record
    return await prisma.dataTable.upsert({
      where: {
        dataSourceId_tableName: {
          dataSourceId,
          tableName,
        },
      },
      create: {
        dataSourceId,
        tableName,
        displayName: tableName,
        physicalName,
        columns: schema,
        rowCount: data.length,
      },
      update: {
        columns: schema,
        rowCount: data.length,
        updatedAt: new Date(),
      },
    })
  }

  private getSQLType(type: string): string {
    // Map generic types to MySQL column types
    switch (type) {
      case "number":
        return "DOUBLE"
      case "boolean":
        return "TINYINT(1)"
      case "date":
        return "DATETIME"
      case "string":
      default:
        return "TEXT"
    }
  }

  /**
   * Insert data into physical table
   */
  private async insertData(
    tableName: string,
    schema: DataSourceSchema,
    data: any[]
  ) {
  const columns = schema.columns.map((c) => `\`${c.name}\``).join(", ")
    const batchSize = 500

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      
      const values = batch.map((row) => {
        const vals = schema.columns.map((col) => {
          const value = row[col.name]
          if (value == null) return "NULL"
          
          if (col.type === "string" || col.type === "date") {
            return `'${String(value).replace(/'/g, "''")}'`
          }
          return value
        })
        return `(${vals.join(", ")})`
      })

      const insertSQL = `
        INSERT INTO \`${tableName}\` (${columns})
        VALUES ${values.join(",\n")}
      `

      await prisma.$executeRawUnsafe(insertSQL)
    }
  }

  /**
   * Append data to existing table (for incremental loads)
   */
  async appendData(
    dataSourceId: string,
    tableName: string,
    newData: any[]
  ) {
    const dataTable = await prisma.dataTable.findUnique({
      where: {
        dataSourceId_tableName: {
          dataSourceId,
          tableName,
        },
      },
    })

    if (!dataTable) {
      throw new Error("Data table not found")
    }

    const schema = dataTable.columns as DataSourceSchema

    // Validate new data
    const validation = this.validateDataAgainstSchema(newData, schema)
    if (!validation.isValid) {
      throw new Error(`Data validation failed: ${validation.errors.join(", ")}`)
    }

    // Insert new data
    await this.insertData(dataTable.physicalName, schema, newData)

    // Update row count
    await prisma.dataTable.update({
      where: { id: dataTable.id },
      data: {
        rowCount: dataTable.rowCount + newData.length,
        updatedAt: new Date(),
      },
    })

    return dataTable
  }

  /**
   * Get data source with tables
   */
  async getDataSource(id: string) {
    return await prisma.dataSource.findUnique({
      where: { id },
      include: {
        tables: true,
        metrics: true,
      },
    })
  }

  /**
   * List all data sources
   */
  async listDataSources(filters?: {
    type?: DataSourceType
    isActive?: boolean
  }) {
    return await prisma.dataSource.findMany({
      where: filters,
      include: {
        tables: true,
        _count: {
          select: {
            metrics: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  }

  /**
   * Delete data source and its physical tables
   */
  async deleteDataSource(id: string) {
    const dataSource = await this.getDataSource(id)
    if (!dataSource) throw new Error("Data source not found")

    // Drop physical tables
    for (const table of dataSource.tables) {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS \`${table.physicalName}\``)
    }

    // Delete data source (cascade will handle related records)
    await prisma.dataSource.delete({
      where: { id },
    })
  }

  /**
   * Query data from a table
   */
  async queryData(
    tableName: string,
    options?: {
      select?: string[]
      where?: any
      orderBy?: any
      limit?: number
      offset?: number
    }
  ) {
  const select = options?.select?.map((c) => `\`${c}\``).join(", ") || "*"
    const limit = options?.limit ? `LIMIT ${options.limit}` : ""
    const offset = options?.offset ? `OFFSET ${options.offset}` : ""

    const query = `
      SELECT ${select}
      FROM \`${tableName}\`
      ${limit} ${offset}
    `

    return await prisma.$queryRawUnsafe(query)
  }
}

export const dataSourceService = new DataSourceService()
