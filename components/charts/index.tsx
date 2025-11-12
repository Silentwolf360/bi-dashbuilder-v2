"use client"

import ReactECharts from "echarts-for-react"
import { useEffect, useState } from "react"

interface ChartData {
  [key: string]: any
}

interface LineChartProps {
  data: ChartData[]
  xField: string
  yFields: string[]
  title?: string
  height?: number
}

export function LineChart({ data, xField, yFields, title, height = 300 }: LineChartProps) {
  const option = {
    title: { text: title },
    tooltip: { trigger: "axis" },
    legend: { data: yFields },
    xAxis: {
      type: "category",
      data: data.map(d => d[xField]),
    },
    yAxis: { type: "value" },
    series: yFields.map(field => ({
      name: field,
      type: "line",
      data: data.map(d => d[field]),
      smooth: true,
    })),
  }

  return <ReactECharts option={option} style={{ height }} />
}

interface BarChartProps {
  data: ChartData[]
  xField: string
  yFields: string[]
  title?: string
  height?: number
  horizontal?: boolean
}

export function BarChart({ data, xField, yFields, title, height = 300, horizontal }: BarChartProps) {
  const option = {
    title: { text: title },
    tooltip: { trigger: "axis" },
    legend: { data: yFields },
    xAxis: horizontal 
      ? { type: "value" }
      : { type: "category", data: data.map(d => d[xField]) },
    yAxis: horizontal
      ? { type: "category", data: data.map(d => d[xField]) }
      : { type: "value" },
    series: yFields.map(field => ({
      name: field,
      type: "bar",
      data: data.map(d => d[field]),
    })),
  }

  return <ReactECharts option={option} style={{ height }} />
}

interface PieChartProps {
  data: ChartData[]
  nameField: string
  valueField: string
  title?: string
  height?: number
  donut?: boolean
}

export function PieChart({ data, nameField, valueField, title, height = 300, donut }: PieChartProps) {
  const option = {
    title: { text: title },
    tooltip: { trigger: "item" },
    legend: { orient: "vertical", left: "left" },
    series: [{
      type: "pie",
      radius: donut ? ["40%", "70%"] : "50%",
      data: data.map(d => ({ name: d[nameField], value: d[valueField] })),
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(0, 0, 0, 0.5)",
        },
      },
    }],
  }

  return <ReactECharts option={option} style={{ height }} />
}

interface AreaChartProps {
  data: ChartData[]
  xField: string
  yFields: string[]
  title?: string
  height?: number
  stacked?: boolean
}

export function AreaChart({ data, xField, yFields, title, height = 300, stacked }: AreaChartProps) {
  const option = {
    title: { text: title },
    tooltip: { trigger: "axis" },
    legend: { data: yFields },
    xAxis: {
      type: "category",
      data: data.map(d => d[xField]),
    },
    yAxis: { type: "value" },
    series: yFields.map(field => ({
      name: field,
      type: "line",
      data: data.map(d => d[field]),
      areaStyle: {},
      smooth: true,
      stack: stacked ? "total" : undefined,
    })),
  }

  return <ReactECharts option={option} style={{ height }} />
}

interface KPICardProps {
  value: number
  label: string
  previousValue?: number
  format?: string
  prefix?: string
  suffix?: string
  trend?: "up" | "down" | "neutral"
}

export function KPICard({ 
  value, 
  label, 
  previousValue, 
  format = "decimal",
  prefix = "",
  suffix = "",
  trend = "neutral"
}: KPICardProps) {
  const formatValue = (val: number) => {
    let formatted = ""
    switch (format) {
      case "currency":
        formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(val)
        break
      case "percent":
        formatted = `${val.toFixed(2)}%`
        break
      case "integer":
        formatted = Math.round(val).toLocaleString()
        break
      default:
        formatted = val.toFixed(2).toLocaleString()
    }
    return `${prefix}${formatted}${suffix}`
  }

  const change = previousValue 
    ? ((value - previousValue) / Math.abs(previousValue)) * 100
    : 0

  const changeColor = change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-600"
  const trendIcon = change > 0 ? "↑" : change < 0 ? "↓" : "→"

  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      <div className="text-3xl font-bold mb-2">{formatValue(value)}</div>
      {previousValue !== undefined && (
        <div className={`text-sm ${changeColor} flex items-center gap-1`}>
          <span>{trendIcon}</span>
          <span>{Math.abs(change).toFixed(2)}%</span>
          <span className="text-gray-500">vs previous</span>
        </div>
      )}
    </div>
  )
}

interface DataTableProps {
  data: ChartData[]
  columns: string[]
  height?: number
}

export function DataTable({ data, columns, height = 400 }: DataTableProps) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden" style={{ maxHeight: height }}>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-4 py-3 text-left font-medium text-gray-700">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-4 py-3">
                    {row[col]?.toString() || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
