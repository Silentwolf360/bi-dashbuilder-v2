import prisma from "./prisma"
import { ChartType } from "@prisma/client"

export interface DashboardConfig {
  name: string
  description?: string
  layout?: any
}

export interface ChartConfig {
  pageId: string
  name: string
  type: ChartType
  x: number
  y: number
  width: number
  height: number
  config: any
  query: any
  visibility?: any
}

export class DashboardService {
  /**
   * Create dashboard
   */
  async createDashboard(data: DashboardConfig, userId: string) {
    return await prisma.dashboard.create({
      data: {
        name: data.name,
        description: data.description,
        layout: data.layout,
        isPublished: false,
      },
    })
  }

  /**
   * Add page to dashboard
   */
  async addPage(dashboardId: string, name: string, order: number) {
    return await prisma.dashboardPage.create({
      data: {
        dashboardId,
        name,
        order,
      },
    })
  }

  /**
   * Add chart to page
   */
  async addChart(data: ChartConfig) {
    const chart = await prisma.chart.create({
      data: {
        pageId: data.pageId,
        name: data.name,
        type: data.type,
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        config: data.config,
        query: data.query,
        visibility: data.visibility,
      },
    })

    return chart
  }

  /**
   * Link metrics to chart
   */
  async linkMetricsToChart(chartId: string, metricIds: string[]) {
    const links = metricIds.map((metricId, index) => ({
      chartId,
      metricId,
      order: index,
    }))

    await prisma.chartMetric.createMany({ data: links })
  }

  /**
   * Update chart position/size
   */
  async updateChartLayout(chartId: string, layout: {
    x: number
    y: number
    width: number
    height: number
  }) {
    return await prisma.chart.update({
      where: { id: chartId },
      data: layout,
    })
  }

  /**
   * Get dashboard with all data
   */
  async getDashboard(id: string, userId: string) {
    const dashboard = await prisma.dashboard.findUnique({
      where: { id },
      include: {
        pages: {
          include: {
            charts: {
              include: {
                metrics: {
                  include: { metric: true },
                  orderBy: { order: "asc" },
                },
              },
            },
            filters: true,
          },
          orderBy: { order: "asc" },
        },
        access: true,
      },
    })

    return dashboard
  }

  /**
   * List dashboards for user
   */
  async listDashboardsForUser(userId: string) {
    const userRoleIds = await prisma.userRole.findMany({
      where: { userId },
      select: { roleId: true },
    })

    const roleIds = userRoleIds.map(ur => ur.roleId)

    return await prisma.dashboard.findMany({
      where: {
        isActive: true,
        access: {
          some: {
            OR: [
              { userId },
              { roleId: { in: roleIds } },
            ],
            canView: true,
          },
        },
      },
      include: {
        pages: {
          select: { id: true, name: true },
        },
        _count: {
          select: { pages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })
  }

  /**
   * Grant dashboard access
   */
  async grantAccess(config: {
    dashboardId: string
    roleId?: string
    userId?: string
    canView: boolean
    canEdit: boolean
    canManage: boolean
    dataFilters?: any
  }) {
    return await prisma.dashboardAccess.create({
      data: config,
    })
  }

  /**
   * Delete chart
   */
  async deleteChart(chartId: string) {
    return await prisma.chart.delete({ where: { id: chartId } })
  }

  /**
   * Delete dashboard
   */
  async deleteDashboard(dashboardId: string) {
    return await prisma.dashboard.delete({ where: { id: dashboardId } })
  }

  /**
   * Publish dashboard
   */
  async publishDashboard(dashboardId: string) {
    return await prisma.dashboard.update({
      where: { id: dashboardId },
      data: { isPublished: true },
    })
  }

  /**
   * Execute chart query with metrics
   */
  async executeChartQuery(chartId: string, userId: string, userFilters?: any) {
    const chart = await prisma.chart.findUnique({
      where: { id: chartId },
      include: {
        metrics: {
          include: { metric: true },
          orderBy: { order: "asc" },
        },
        page: {
          include: {
            dashboard: {
              include: {
                pages: {
                  include: { filters: true },
                },
              },
            },
          },
        },
      },
    })

    if (!chart) throw new Error("Chart not found")

    const query = chart.query as any
    const mergedFilters = { ...query.filters, ...userFilters }

    // Execute query based on chart type
    if (chart.type === "KPI_CARD") {
      return await this.executeKPICard(chart, mergedFilters)
    } else {
      return await this.executeStandardChart(chart, mergedFilters)
    }
  }

  private async executeKPICard(chart: any, filters: any) {
    const metric = chart.metrics[0]?.metric
    if (!metric) throw new Error("No metric configured")

    const { metricService } = await import("./metric.service")
    const result = await metricService.executeMetric(metric.id, filters)

    return {
      value: result[0]?.value || 0,
      metric: metric.name,
      format: metric.format,
    }
  }

  private async executeStandardChart(chart: any, filters: any) {
    const query = chart.query as any
    const { queryBuilderService } = await import("./query-builder.service")

    if (query.timeSeriesConfig) {
      return await queryBuilderService.buildTimeSeriesQuery({
        dataSourceId: query.dataSourceId,
        metrics: chart.metrics.map((m: any) => m.metricId),
        dateField: query.timeSeriesConfig.dateField,
        granularity: query.timeSeriesConfig.granularity,
        startDate: query.timeSeriesConfig.startDate,
        endDate: query.timeSeriesConfig.endDate,
        filters,
      })
    } else {
      return await queryBuilderService.buildChartQuery({
        dataSourceId: query.dataSourceId,
        metrics: chart.metrics.map((m: any) => m.metricId),
        dimensions: query.dimensions || [],
        filters,
        orderBy: query.orderBy,
        limit: query.limit,
      })
    }
  }
}

export const dashboardService = new DashboardService()
