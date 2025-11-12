"use client"

import { useState, useEffect } from "react"
import GridLayout from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, Save, Eye } from "lucide-react"
import { LineChart, BarChart, PieChart, KPICard, DataTable } from "@/components/charts"

interface ChartWidget {
  i: string
  x: number
  y: number
  w: number
  h: number
  chartType: string
  name: string
  config: any
  data?: any[]
}

export default function DashboardBuilder({ dashboardId }: { dashboardId: string }) {
  const [widgets, setWidgets] = useState<ChartWidget[]>([])
  const [editMode, setEditMode] = useState(true)
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null)

  const handleLayoutChange = (layout: any[]) => {
    const updated = widgets.map(widget => {
      const layoutItem = layout.find(l => l.i === widget.i)
      if (layoutItem) {
        return { ...widget, x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h }
      }
      return widget
    })
    setWidgets(updated)
  }

  const addWidget = (chartType: string) => {
    const newWidget: ChartWidget = {
      i: `widget-${Date.now()}`,
      x: 0,
      y: Infinity,
      w: 6,
      h: 4,
      chartType,
      name: `New ${chartType}`,
      config: {},
      data: generateSampleData(chartType),
    }
    setWidgets([...widgets, newWidget])
  }

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.i !== id))
  }

  const saveDashboard = async () => {
    // Save layout to backend
    alert("Dashboard saved!")
  }

  const generateSampleData = (type: string) => {
    if (type === "KPI") {
      return [{ value: 125000, previousValue: 98000 }]
    }
    return [
      { month: "Jan", sales: 4000, revenue: 2400 },
      { month: "Feb", sales: 3000, revenue: 1398 },
      { month: "Mar", sales: 2000, revenue: 9800 },
      { month: "Apr", sales: 2780, revenue: 3908 },
      { month: "May", sales: 1890, revenue: 4800 },
      { month: "Jun", sales: 2390, revenue: 3800 },
    ]
  }

  const renderChart = (widget: ChartWidget) => {
    const height = widget.h * 80 - 60

    switch (widget.chartType) {
      case "LINE":
        return <LineChart data={widget.data || []} xField="month" yFields={["sales", "revenue"]} height={height} />
      case "BAR":
        return <BarChart data={widget.data || []} xField="month" yFields={["sales"]} height={height} />
      case "PIE":
        return <PieChart data={widget.data || []} nameField="month" valueField="sales" height={height} />
      case "KPI":
        const kpiData = widget.data?.[0] || {}
        return <KPICard value={kpiData.value} label={widget.name} previousValue={kpiData.previousValue} format="currency" />
      case "TABLE":
        return <DataTable data={widget.data || []} columns={["month", "sales", "revenue"]} height={height} />
      default:
        return <div>Unknown chart type</div>
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center p-4 bg-white rounded-lg border">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => addWidget("KPI")}>
            <Plus className="w-4 h-4 mr-1" /> KPI Card
          </Button>
          <Button size="sm" variant="outline" onClick={() => addWidget("LINE")}>
            <Plus className="w-4 h-4 mr-1" /> Line Chart
          </Button>
          <Button size="sm" variant="outline" onClick={() => addWidget("BAR")}>
            <Plus className="w-4 h-4 mr-1" /> Bar Chart
          </Button>
          <Button size="sm" variant="outline" onClick={() => addWidget("PIE")}>
            <Plus className="w-4 h-4 mr-1" /> Pie Chart
          </Button>
          <Button size="sm" variant="outline" onClick={() => addWidget("TABLE")}>
            <Plus className="w-4 h-4 mr-1" /> Table
          </Button>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditMode(!editMode)}>
            <Eye className="w-4 h-4 mr-1" /> {editMode ? "Preview" : "Edit"}
          </Button>
          <Button size="sm" onClick={saveDashboard}>
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="bg-gray-50 p-4 rounded-lg min-h-[600px]">
        <GridLayout
          className="layout"
          layout={widgets.map(w => ({ i: w.i, x: w.x, y: w.y, w: w.w, h: w.h }))}
          cols={12}
          rowHeight={80}
          width={1200}
          onLayoutChange={handleLayoutChange}
          isDraggable={editMode}
          isResizable={editMode}
        >
          {widgets.map(widget => (
            <div key={widget.i} className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <Card className="h-full">
                <CardContent className="p-4 h-full flex flex-col">
                  {editMode && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{widget.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeWidget(widget.i)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    {renderChart(widget)}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </GridLayout>
      </div>
    </div>
  )
}
