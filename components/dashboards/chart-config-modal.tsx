"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

interface ChartConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: any) => void
  chartType: string
}

export default function ChartConfigModal({ isOpen, onClose, onSave, chartType }: ChartConfigModalProps) {
  const [dataSources, setDataSources] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any[]>([])
  const [config, setConfig] = useState({
    name: "",
    dataSourceId: "",
    metricIds: [] as string[],
    dimensions: [] as string[],
    dateField: "",
    granularity: "day",
    chartConfig: {},
  })

  useEffect(() => {
    if (isOpen) {
      fetchDataSources()
    }
  }, [isOpen])

  useEffect(() => {
    if (config.dataSourceId) {
      fetchMetrics()
    }
  }, [config.dataSourceId])

  const fetchDataSources = async () => {
    const res = await fetch("/api/data-sources")
    const data = await res.json()
    if (data.success) setDataSources(data.data)
  }

  const fetchMetrics = async () => {
    const res = await fetch(`/api/metrics?dataSourceId=${config.dataSourceId}`)
    const data = await res.json()
    if (data.success) setMetrics(data.data)
  }

  const handleSave = () => {
    onSave(config)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Configure {chartType} Chart</h3>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          {/* Chart Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Chart Name</label>
            <Input
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              placeholder="My Chart"
            />
          </div>

          {/* Data Source */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Source</label>
            <select
              className="w-full h-10 px-3 border rounded-md"
              value={config.dataSourceId}
              onChange={(e) => setConfig({ ...config, dataSourceId: e.target.value })}
            >
              <option value="">Select data source</option>
              {dataSources.map(ds => (
                <option key={ds.id} value={ds.id}>{ds.name}</option>
              ))}
            </select>
          </div>

          {/* Metrics */}
          {config.dataSourceId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Metrics</label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                {metrics.map(metric => (
                  <label key={metric.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.metricIds.includes(metric.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setConfig({
                            ...config,
                            metricIds: [...config.metricIds, metric.id]
                          })
                        } else {
                          setConfig({
                            ...config,
                            metricIds: config.metricIds.filter(id => id !== metric.id)
                          })
                        }
                      }}
                    />
                    <span className="text-sm">{metric.displayName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Time Series Config */}
          {["LINE", "AREA", "BAR"].includes(chartType) && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Field</label>
                <Input
                  value={config.dateField}
                  onChange={(e) => setConfig({ ...config, dateField: e.target.value })}
                  placeholder="date"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Granularity</label>
                <select
                  className="w-full h-10 px-3 border rounded-md"
                  value={config.granularity}
                  onChange={(e) => setConfig({ ...config, granularity: e.target.value })}
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="quarter">Quarter</option>
                  <option value="year">Year</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </div>
      </div>
    </div>
  )
}
