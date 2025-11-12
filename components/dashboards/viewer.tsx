"use client"

import { useState, useEffect } from "react"
import { LineChart, BarChart, PieChart, KPICard, DataTable } from "@/components/charts"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Download } from "lucide-react"

interface DashboardViewerProps {
  dashboardId: string
}

export default function DashboardViewer({ dashboardId }: DashboardViewerProps) {
  const [dashboard, setDashboard] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState<any>({})
  const [chartData, setChartData] = useState<{ [key: string]: any[] }>({})

  useEffect(() => {
    loadDashboard()
  }, [dashboardId])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboards/${dashboardId}`)
      const data = await res.json()
      if (data.success) {
        setDashboard(data.data)
        await loadAllChartData(data.data)
      }
    } catch (err) {
      console.error("Failed to load dashboard", err)
    } finally {
      setLoading(false)
    }
  }

  const loadAllChartData = async (dashboardData: any) => {
    const page = dashboardData.pages[0]
    if (!page) return

    const dataPromises = page.charts.map(async (chart: any) => {
      const res = await fetch(`/api/charts/${chart.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: activeFilters }),
      })
      const result = await res.json()
      return { chartId: chart.id, data: result.data }
    })

    const results = await Promise.all(dataPromises)
    const dataMap: any = {}
    results.forEach(r => {
      dataMap[r.chartId] = r.data
    })
    setChartData(dataMap)
  }

  const refreshData = () => {
    if (dashboard) loadAllChartData(dashboard)
  }

  const renderChart = (chart: any) => {
    const data = chartData[chart.id] || []
    const height = chart.height * 80 - 60
    const config = chart.config || {}

    switch (chart.type) {
      case "LINE":
        return (
          <LineChart
            data={data}
            xField={config.xField || "date"}
            yFields={chart.metrics.map((m: any) => m.metric.name)}
            title={chart.name}
            height={height}
          />
        )
      case "BAR":
        return (
          <BarChart
            data={data}
            xField={config.xField || "category"}
            yFields={chart.metrics.map((m: any) => m.metric.name)}
            title={chart.name}
            height={height}
            horizontal={config.horizontal}
          />
        )
      case "PIE":
        return (
          <PieChart
            data={data}
            nameField={config.nameField || "name"}
            valueField={chart.metrics[0]?.metric.name || "value"}
            title={chart.name}
            height={height}
            donut={config.donut}
          />
        )
      case "KPI_CARD":
        const kpiValue = data[0]?.value || 0
        const metric = chart.metrics[0]?.metric
        return (
          <KPICard
            value={kpiValue}
            label={chart.name}
            format={metric?.format}
            prefix={metric?.prefix}
            suffix={metric?.suffix}
          />
        )
      case "TABLE":
        const columns = data[0] ? Object.keys(data[0]) : []
        return <DataTable data={data} columns={columns} height={height} />
      default:
        return <div className="p-4 text-gray-500">Unsupported chart type: {chart.type}</div>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Dashboard not found</div>
      </div>
    )
  }

  const page = dashboard.pages[0]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white rounded-lg border">
        <div>
          <h1 className="text-2xl font-bold">{dashboard.name}</h1>
          {dashboard.description && (
            <p className="text-gray-600 text-sm mt-1">{dashboard.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4">
        {page?.charts.map((chart: any) => (
          <div
            key={chart.id}
            className="bg-white rounded-lg border shadow-sm overflow-hidden"
            style={{
              gridColumn: `span ${chart.width}`,
              minHeight: `${chart.height * 80}px`,
            }}
          >
            <Card className="h-full">
              <CardContent className="p-4 h-full">
                {renderChart(chart)}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
