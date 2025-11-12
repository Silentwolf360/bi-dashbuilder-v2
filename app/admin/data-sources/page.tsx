import DataSourceUpload from "@/components/data-sources/upload"

export default function DataSourcesPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Data Sources</h1>
        <p className="text-gray-600">Manage and upload data sources</p>
      </div>
      <DataSourceUpload />
    </div>
  )
}
