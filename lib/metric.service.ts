import prisma from "./prisma"
import { MetricType } from "@prisma/client"

export interface MetricDefinition {
  name: string
  displayName: string
  description?: string
  type: MetricType
  expression: string
  dataSourceId?: string
  format?: string
  decimalPlaces?: number
  prefix?: string
  suffix?: string
  aggregation?: string
}

export interface ParsedMetric {
  type: "aggregation" | "formula" | "timeIntel"
  field?: string
  aggregation?: string
  formula?: string
  timeFunction?: string
  dependencies?: string[]
}

export class MetricService {
  /**
   * Create a new metric
   */
  async createMetric(data: MetricDefinition) {
    const parsed = this.parseMetricExpression(data.expression)

    return await prisma.metric.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        type: data.type,
        expression: data.expression,
        parsedFormula: parsed,
        dataSourceId: data.dataSourceId,
        format: data.format || "decimal",
        decimalPlaces: data.decimalPlaces ?? 2,
        prefix: data.prefix,
        suffix: data.suffix,
        aggregation: data.aggregation,
      },
    })
  }

  /**
   * Parse metric expression into executable structure
   */
  parseMetricExpression(expression: string): ParsedMetric {
    // Remove whitespace
    const expr = expression.trim()

    // Check for time intelligence functions
    const timeIntelPattern = /^(YTD|QTD|MTD|YOY|MOM|QOQ|PreviousPeriod|RollingAverage|RollingSum|CAGR)\(/i
    if (timeIntelPattern.test(expr)) {
      return this.parseTimeIntelFunction(expr)
    }

    // Check for simple aggregation: SUM(field), AVG(field), etc.
    const aggPattern = /^(SUM|AVG|COUNT|MIN|MAX)\(([^)]+)\)$/i
    const aggMatch = expr.match(aggPattern)
    if (aggMatch) {
      return {
        type: "aggregation",
        aggregation: aggMatch[1].toUpperCase(),
        field: aggMatch[2].trim(),
      }
    }

    // Otherwise it's a formula
    return {
      type: "formula",
      formula: expr,
      dependencies: this.extractDependencies(expr),
    }
  }

  /**
   * Parse time intelligence function
   */
  private parseTimeIntelFunction(expr: string): ParsedMetric {
    const match = expr.match(/^(\w+)\((.+)\)$/i)
    if (!match) throw new Error("Invalid time intelligence function")

    const [, funcName, innerExpr] = match

    return {
      type: "timeIntel",
      timeFunction: funcName.toUpperCase(),
      formula: innerExpr.trim(),
      dependencies: this.extractDependencies(innerExpr),
    }
  }

  /**
   * Extract metric dependencies from formula
   */
  private extractDependencies(formula: string): string[] {
    // Extract metric names (alphanumeric + underscore)
    const metricPattern = /\b([A-Z][A-Za-z0-9_]*)\b/g
    const matches = formula.match(metricPattern) || []
    return [...new Set(matches)]
  }

  /**
   * Build SQL query for metric calculation
   */
  async buildMetricQuery(
    metricId: string,
    filters?: any,
    groupBy?: string[],
    dateField?: string
  ): Promise<string> {
    const metric = await prisma.metric.findUnique({
      where: { id: metricId },
      include: { dataSource: { include: { tables: true } } },
    })

    if (!metric) throw new Error("Metric not found")

    const parsed = metric.parsedFormula as ParsedMetric
    const table = metric.dataSource?.tables[0]

    if (!table) throw new Error("No data table found for metric")

    let selectClause = ""
    let whereClause = this.buildWhereClause(filters)
    let groupByClause = groupBy && groupBy.length > 0 
      ? `GROUP BY ${groupBy.map(g => `"${g}"`).join(", ")}`
      : ""

    switch (parsed.type) {
      case "aggregation":
        selectClause = `${parsed.aggregation}("${parsed.field}") as value`
        break

      case "formula":
        selectClause = `(${this.translateFormula(parsed.formula!)}) as value`
        break

      case "timeIntel":
        return this.buildTimeIntelQuery(metric, parsed, table.physicalName, filters, groupBy, dateField)
    }

    if (groupBy && groupBy.length > 0) {
      selectClause = groupBy.map(g => `"${g}"`).join(", ") + ", " + selectClause
    }

    return `
      SELECT ${selectClause}
      FROM "${table.physicalName}"
      ${whereClause}
      ${groupByClause}
    `.trim()
  }

  /**
   * Build WHERE clause from filters
   */
  private buildWhereClause(filters?: any): string {
    if (!filters || Object.keys(filters).length === 0) return ""

    const conditions = Object.entries(filters).map(([key, value]) => {
      if (Array.isArray(value)) {
        const values = value.map(v => `'${v}'`).join(", ")
        return `"${key}" IN (${values})`
      } else if (typeof value === "string") {
        return `"${key}" = '${value}'`
      } else {
        return `"${key}" = ${value}`
      }
    })

    return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  }

  /**
   * Translate formula to SQL
   */
  private translateFormula(formula: string): string {
    // Replace metric references with their SQL
    // This is simplified - production would recursively resolve metrics
    return formula
      .replace(/SUM\(([^)]+)\)/gi, 'SUM("$1")')
      .replace(/AVG\(([^)]+)\)/gi, 'AVG("$1")')
      .replace(/COUNT\(([^)]+)\)/gi, 'COUNT("$1")')
      .replace(/MIN\(([^)]+)\)/gi, 'MIN("$1")')
      .replace(/MAX\(([^)]+)\)/gi, 'MAX("$1")')
  }

  /**
   * Build time intelligence query
   */
  private buildTimeIntelQuery(
    metric: any,
    parsed: ParsedMetric,
    tableName: string,
    filters?: any,
    groupBy?: string[],
    dateField?: string
  ): string {
    if (!dateField) throw new Error("Date field required for time intelligence")

    const innerMetric = this.translateFormula(parsed.formula!)
    const whereClause = this.buildWhereClause(filters)

    switch (parsed.timeFunction) {
      case "YTD":
        return `
          SELECT ${groupBy ? groupBy.map(g => `"${g}"`).join(", ") + "," : ""}
                 SUM(${innerMetric}) as value
          FROM "${tableName}"
          WHERE "${dateField}" >= DATE_TRUNC('year', CURRENT_DATE)
          ${whereClause ? "AND " + whereClause.replace("WHERE ", "") : ""}
          ${groupBy ? `GROUP BY ${groupBy.map(g => `"${g}"`).join(", ")}` : ""}
        `

      case "QTD":
        return `
          SELECT ${groupBy ? groupBy.map(g => `"${g}"`).join(", ") + "," : ""}
                 SUM(${innerMetric}) as value
          FROM "${tableName}"
          WHERE "${dateField}" >= DATE_TRUNC('quarter', CURRENT_DATE)
          ${whereClause ? "AND " + whereClause.replace("WHERE ", "") : ""}
          ${groupBy ? `GROUP BY ${groupBy.map(g => `"${g}"`).join(", ")}` : ""}
        `

      case "MTD":
        return `
          SELECT ${groupBy ? groupBy.map(g => `"${g}"`).join(", ") + "," : ""}
                 SUM(${innerMetric}) as value
          FROM "${tableName}"
          WHERE "${dateField}" >= DATE_TRUNC('month', CURRENT_DATE)
          ${whereClause ? "AND " + whereClause.replace("WHERE ", "") : ""}
          ${groupBy ? `GROUP BY ${groupBy.map(g => `"${g}"`).join(", ")}` : ""}
        `

      case "YOY":
        return `
          SELECT 
            current.value,
            previous.value as previous_value,
            ((current.value - previous.value) / NULLIF(previous.value, 0) * 100) as yoy_change
          FROM (
            SELECT SUM(${innerMetric}) as value
            FROM "${tableName}"
            WHERE EXTRACT(YEAR FROM "${dateField}") = EXTRACT(YEAR FROM CURRENT_DATE)
            ${whereClause ? "AND " + whereClause.replace("WHERE ", "") : ""}
          ) current
          CROSS JOIN (
            SELECT SUM(${innerMetric}) as value
            FROM "${tableName}"
            WHERE EXTRACT(YEAR FROM "${dateField}") = EXTRACT(YEAR FROM CURRENT_DATE) - 1
            ${whereClause ? "AND " + whereClause.replace("WHERE ", "") : ""}
          ) previous
        `

      case "MOM":
        return `
          SELECT 
            current.value,
            previous.value as previous_value,
            ((current.value - previous.value) / NULLIF(previous.value, 0) * 100) as mom_change
          FROM (
            SELECT SUM(${innerMetric}) as value
            FROM "${tableName}"
            WHERE DATE_TRUNC('month', "${dateField}") = DATE_TRUNC('month', CURRENT_DATE)
            ${whereClause ? "AND " + whereClause.replace("WHERE ", "") : ""}
          ) current
          CROSS JOIN (
            SELECT SUM(${innerMetric}) as value
            FROM "${tableName}"
            WHERE DATE_TRUNC('month', "${dateField}") = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
            ${whereClause ? "AND " + whereClause.replace("WHERE ", "") : ""}
          ) previous
        `

      case "ROLLINGAVERAGE":
        // Extract N from RollingAverage(expr, N)
        const avgMatch = parsed.formula!.match(/,\s*(\d+)\s*$/)
        const avgN = avgMatch ? parseInt(avgMatch[1]) : 3
        
        return `
          SELECT "${dateField}",
                 AVG(${innerMetric}) OVER (
                   ORDER BY "${dateField}"
                   ROWS BETWEEN ${avgN - 1} PRECEDING AND CURRENT ROW
                 ) as value
          FROM "${tableName}"
          ${whereClause}
          ORDER BY "${dateField}"
        `

      case "ROLLINGSUM":
        const sumMatch = parsed.formula!.match(/,\s*(\d+)\s*$/)
        const sumN = sumMatch ? parseInt(sumMatch[1]) : 3
        
        return `
          SELECT "${dateField}",
                 SUM(${innerMetric}) OVER (
                   ORDER BY "${dateField}"
                   ROWS BETWEEN ${sumN - 1} PRECEDING AND CURRENT ROW
                 ) as value
          FROM "${tableName}"
          ${whereClause}
          ORDER BY "${dateField}"
        `

      default:
        throw new Error(`Unsupported time intelligence function: ${parsed.timeFunction}`)
    }
  }

  /**
   * Execute metric query
   */
  async executeMetric(
    metricId: string,
    filters?: any,
    groupBy?: string[],
    dateField?: string
  ): Promise<any[]> {
    const query = await this.buildMetricQuery(metricId, filters, groupBy, dateField)
    return await prisma.$queryRawUnsafe(query)
  }

  /**
   * Get metric by ID
   */
  async getMetric(id: string) {
    return await prisma.metric.findUnique({
      where: { id },
      include: { dataSource: true },
    })
  }

  /**
   * List metrics
   */
  async listMetrics(filters?: {
    dataSourceId?: string
    type?: MetricType
    isActive?: boolean
  }) {
    return await prisma.metric.findMany({
      where: filters,
      include: {
        dataSource: true,
        _count: {
          select: { charts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * Delete metric
   */
  async deleteMetric(id: string) {
    return await prisma.metric.delete({
      where: { id },
    })
  }

  /**
   * Validate metric expression
   */
  validateExpression(expression: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    try {
      this.parseMetricExpression(expression)
    } catch (err: any) {
      errors.push(err.message)
    }

    // Check for balanced parentheses
    let depth = 0
    for (const char of expression) {
      if (char === "(") depth++
      if (char === ")") depth--
      if (depth < 0) {
        errors.push("Unbalanced parentheses")
        break
      }
    }
    if (depth !== 0) errors.push("Unbalanced parentheses")

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

export const metricService = new MetricService()
