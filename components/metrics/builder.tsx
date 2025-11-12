"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calculator, CheckCircle, AlertCircle } from "lucide-react"

interface DataSource {
  id: string
  name: string
  tables: Array<{ columns: any }>
}

export default function MetricBuilder() {
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [selectedSource, setSelectedSource] = useState<string>("")
  const [metricName, setMetricName] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [expression, setExpression] = useState("")
  const [metricType, setMetricType] = useState<"SIMPLE" | "CALCULATED" | "TIME_INTEL">("SIMPLE")
  const [format, setFormat] = useState("decimal")
  const [validationStatus, setValidationStatus] = useState<{
    isValid: boolean
    errors: string[]
  } | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchDataSources()
  }, [])

  const fetchDataSources = async () => {
    const res = await fetch("/api/data-sources")
    const data = await res.json()
    if (data.success) setDataSources(data.data)
  }

  const validateExpression = () => {
    // Simple validation
    if (!expression.trim()) {
      setValidationStatus({ isValid: false, errors: ["Expression cannot be empty"] })
      return
    }

    // Check parentheses balance
    let depth = 0
    for (const char of expression) {
      if (char === "(") depth++
      if (char === ")") depth--
      if (depth < 0) break
    }

    if (depth !== 0) {
      setValidationStatus({ isValid: false, errors: ["Unbalanced parentheses"] })
      return
    }

    setValidationStatus({ isValid: true, errors: [] })
  }

  const handleCreate = async () => {
    if (!metricName || !expression) return

    setCreating(true)
    try {
      const res = await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: metricName,
          displayName: displayName || metricName,
          type: metricType,
          expression,
          dataSourceId: selectedSource || undefined,
          format,
          decimalPlaces: 2,
        }),
      })

      const result = await res.json()
      if (result.success) {
        alert("Metric created successfully!")
        setMetricName("")
        setDisplayName("")
        setExpression("")
        setValidationStatus(null)
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setCreating(false)
    }
  }

  const insertFunction = (func: string) => {
    setExpression(prev => prev + func)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Metric</CardTitle>
          <CardDescription>Define KPIs and calculated metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Metric Name</label>
              <Input
                value={metricName}
                onChange={(e) => setMetricName(e.target.value)}
                placeholder="revenue_growth"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Name</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Revenue Growth"
              />
            </div>
          </div>

          {/* Type & Source */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Metric Type</label>
              <select
                className="w-full h-10 px-3 border rounded-md"
                value={metricType}
                onChange={(e) => setMetricType(e.target.value as any)}
              >
                <option value="SIMPLE">Simple Aggregation</option>
                <option value="CALCULATED">Calculated</option>
                <option value="TIME_INTEL">Time Intelligence</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Source</label>
              <select
                className="w-full h-10 px-3 border rounded-md"
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
              >
                <option value="">Select data source</option>
                {dataSources.map(ds => (
                  <option key={ds.id} value={ds.id}>{ds.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Expression Editor */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Expression</label>
            <textarea
              className="w-full h-32 px-3 py-2 border rounded-md font-mono text-sm"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="SUM(Amount) or (SUM(Revenue) - SUM(Cost)) / SUM(Revenue) * 100"
            />
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => insertFunction("SUM()")}>
                SUM
              </Button>
              <Button size="sm" variant="outline" onClick={() => insertFunction("AVG()")}>
                AVG
              </Button>
              <Button size="sm" variant="outline" onClick={() => insertFunction("COUNT()")}>
                COUNT
              </Button>
              <Button size="sm" variant="outline" onClick={() => insertFunction("YTD()")}>
                YTD
              </Button>
              <Button size="sm" variant="outline" onClick={() => insertFunction("MOM()")}>
                MOM
              </Button>
              <Button size="sm" variant="outline" onClick={() => insertFunction("YOY()")}>
                YOY
              </Button>
            </div>
          </div>

          {/* Validation */}
          <Button onClick={validateExpression} variant="outline" size="sm">
            Validate Expression
          </Button>

          {validationStatus && (
            <div className={`flex items-center gap-2 p-3 rounded-md ${
              validationStatus.isValid 
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              {validationStatus.isValid ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Expression is valid</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <div className="text-sm">
                    {validationStatus.errors.map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Format Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <select
                className="w-full h-10 px-3 border rounded-md"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="decimal">Decimal</option>
                <option value="currency">Currency</option>
                <option value="percent">Percent</option>
                <option value="integer">Integer</option>
              </select>
            </div>
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreate}
            disabled={!metricName || !expression || creating}
            className="w-full"
          >
            {creating ? "Creating..." : <><Calculator className="w-4 h-4 mr-2" /> Create Metric</>}
          </Button>
        </CardContent>
      </Card>

      {/* Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Expression Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <div className="font-mono bg-gray-50 p-2 rounded">SUM(Amount)</div>
            <div className="text-gray-600 text-xs mt-1">Total sum of Amount column</div>
          </div>
          <div>
            <div className="font-mono bg-gray-50 p-2 rounded">
              (SUM(Revenue) - SUM(Cost)) / SUM(Revenue) * 100
            </div>
            <div className="text-gray-600 text-xs mt-1">Profit margin percentage</div>
          </div>
          <div>
            <div className="font-mono bg-gray-50 p-2 rounded">YOY(SUM(Sales))</div>
            <div className="text-gray-600 text-xs mt-1">Year-over-year sales growth</div>
          </div>
          <div>
            <div className="font-mono bg-gray-50 p-2 rounded">RollingAverage(SUM(Revenue), 3)</div>
            <div className="text-gray-600 text-xs mt-1">3-month rolling average</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
