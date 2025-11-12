import prisma from "./prisma"
import { metricService } from "./metric.service"

export interface QueryBuilder {
  select: string[]
  from: string
  joins?: Array<{
    type: "INNER" | "LEFT" | "RIGHT"
    table: string
    on: string
  }>
  where?: any
  groupBy?: string[]
  orderBy?: Array<{
    field: string
    direction: "ASC" | "DESC"
  }>
  limit?: number
  offset?: number
}

export class QueryBuilderService {
  /**
   * Build SQL query from query definition
   */
  buildQuery(query: QueryBuilder): string {
    const selectClause = query.select.map(s => `"${s}"`).join(", ")
    const fromClause = `FROM "${query.from}"`
    
    let joinsClause = ""
    if (query.joins && query.joins.length > 0) {
      joinsClause = query.joins
        .map(j => `${j.type} JOIN "${j.table}" ON ${j.on}`)
        .join("\n")
    }

    const whereClause = this.buildWhereClause(query.where)
    
    const groupByClause = query.groupBy && query.groupBy.length > 0
      ? `GROUP BY ${query.groupBy.map(g => `"${g}"`).join(", ")}`
      : ""

    const orderByClause = query.orderBy && query.orderBy.length > 0
      ? `ORDER BY ${query.orderBy.map(o => `"${o.field}" ${o.direction}`).join(", ")}`
      : ""

    const limitClause = query.limit ? `LIMIT ${query.limit}` : ""
    const offsetClause = query.offset ? `OFFSET ${query.offset}` : ""

    return `
      SELECT ${selectClause}
      ${fromClause}
      ${joinsClause}
      ${whereClause}
      ${groupByClause}
      ${orderByClause}
      ${limitClause}
      ${offsetClause}
    `.trim().replace(/\s+/g, " ")
  }

  /**
   * Build WHERE clause
   */
  private buildWhereClause(where?: any): string {
    if (!where || Object.keys(where).length === 0) return ""

    const conditions: string[] = []

    for (const [key, value] of Object.entries(where)) {
      if (key === "AND" || key === "OR") {
        const nested = (value as any[]).map(v => this.buildWhereClause(v))
        conditions.push(`(${nested.join(` ${key} `)})`)
      } else if (typeof value === "object" && value !== null) {
        // Handle operators: { gt, lt, gte, lte, in, contains, etc. }
        for (const [op, val] of Object.entries(value)) {
          conditions.push(this.buildCondition(key, op, val))
        }
      } else {
        conditions.push(`"${key}" = ${this.formatValue(value)}`)
      }
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  }

  /**
   * Build condition with operator
   */
  private buildCondition(field: string, operator: string, value: any): string {
    switch (operator) {
      case "gt":
        return `"${field}" > ${this.formatValue(value)}`
      case "gte":
        return `"${field}" >= ${this.formatValue(value)}`
      case "lt":
        return `"${field}" < ${this.formatValue(value)}`
      case "lte":
        return `"${field}" <= ${this.formatValue(value)}`
      case "ne":
        return `"${field}" != ${this.formatValue(value)}`
      case "in":
        const values = (value as any[]).map(v => this.formatValue(v)).join(", ")
        return `"${field}" IN (${values})`
      case "notIn":
        const notValues = (value as any[]).map(v => this.formatValue(v)).join(", ")
        return `"${field}" NOT IN (${notValues})`
      case "contains":
        return `"${field}" LIKE ${this.formatValue(`%${value}%`)}`
      case "startsWith":
        return `"${field}" LIKE ${this.formatValue(`${value}%`)}`
      case "endsWith":
        return `"${field}" LIKE ${this.formatValue(`%${value}`)}`
      default:
        return `"${field}" = ${this.formatValue(value)}`
    }
  }

  /**
   * Format value for SQL
   */
  private formatValue(value: any): string {
    if (value === null) return "NULL"
    if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE"
    return String(value)
  }

  /**
   * Execute query
   */
  async executeQuery(query: QueryBuilder): Promise<any[]> {
    const sql = this.buildQuery(query)
    return await prisma.$queryRawUnsafe(sql)
  }

  /**
   * Build chart query with metrics
   */
  async buildChartQuery(config: {
    dataSourceId: string
    metrics: string[] // metric IDs
    dimensions: string[] // fields to group by
    filters?: any
    orderBy?: Array<{ field: string; direction: "ASC" | "DESC" }>
    limit?: number
  }): Promise<any[]> {
    const dataSource = await prisma.dataSource.findUnique({
      where: { id: config.dataSourceId },
      include: { tables: true },
    })

    if (!dataSource || !dataSource.tables[0]) {
      throw new Error("Data source not found")
    }

    const table = dataSource.tables[0]
    
    // Build select with dimensions and metrics
    const select: string[] = [...config.dimensions]
    
    // Add metric calculations
    for (const metricId of config.metrics) {
      const metric = await prisma.metric.findUnique({ where: { id: metricId } })
      if (!metric) continue

      const parsed = metric.parsedFormula as any
      
      if (parsed.type === "aggregation") {
        select.push(`${parsed.aggregation}("${parsed.field}") as "${metric.name}"`)
      } else if (parsed.type === "formula") {
        select.push(`(${parsed.formula}) as "${metric.name}"`)
      }
    }

    const query: QueryBuilder = {
      select,
      from: table.physicalName,
      where: config.filters,
      groupBy: config.dimensions.length > 0 ? config.dimensions : undefined,
      orderBy: config.orderBy,
      limit: config.limit,
    }

    return await this.executeQuery(query)
  }

  /**
   * Build time-series query
   */
  async buildTimeSeriesQuery(config: {
    dataSourceId: string
    metrics: string[]
    dateField: string
    granularity: "day" | "week" | "month" | "quarter" | "year"
    startDate?: Date
    endDate?: Date
    filters?: any
  }): Promise<any[]> {
    const dataSource = await prisma.dataSource.findUnique({
      where: { id: config.dataSourceId },
      include: { tables: true },
    })

    if (!dataSource || !dataSource.tables[0]) {
      throw new Error("Data source not found")
    }

    const table = dataSource.tables[0]
    
    // Build date truncation
    let dateTrunc = ""
    switch (config.granularity) {
      case "day":
        dateTrunc = `DATE_TRUNC('day', "${config.dateField}")`
        break
      case "week":
        dateTrunc = `DATE_TRUNC('week', "${config.dateField}")`
        break
      case "month":
        dateTrunc = `DATE_TRUNC('month', "${config.dateField}")`
        break
      case "quarter":
        dateTrunc = `DATE_TRUNC('quarter', "${config.dateField}")`
        break
      case "year":
        dateTrunc = `DATE_TRUNC('year', "${config.dateField}")`
        break
    }

    const select = [`${dateTrunc} as period`]

    // Add metrics
    for (const metricId of config.metrics) {
      const metric = await prisma.metric.findUnique({ where: { id: metricId } })
      if (!metric) continue

      const parsed = metric.parsedFormula as any
      if (parsed.type === "aggregation") {
        select.push(`${parsed.aggregation}("${parsed.field}") as "${metric.name}"`)
      }
    }

    // Build date filters
    const dateFilters: any = {}
    if (config.startDate) {
      dateFilters[config.dateField] = { gte: config.startDate }
    }
    if (config.endDate) {
      dateFilters[config.dateField] = { 
        ...dateFilters[config.dateField],
        lte: config.endDate 
      }
    }

    const where = { ...config.filters, ...dateFilters }

    const query: QueryBuilder = {
      select,
      from: table.physicalName,
      where,
      groupBy: ["period"],
      orderBy: [{ field: "period", direction: "ASC" }],
    }

    return await this.executeQuery(query)
  }
}

export const queryBuilderService = new QueryBuilderService()
