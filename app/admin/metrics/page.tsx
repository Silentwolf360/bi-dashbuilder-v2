import MetricBuilder from "@/components/metrics/builder"

export default function MetricsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Metrics</h1>
        <p className="text-gray-600">Create and manage KPIs and calculated metrics</p>
      </div>
      <MetricBuilder />
    </div>
  )
}
