"use client"

import DashboardBuilder from "@/components/dashboards/builder"

export default function DashboardBuilderPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard Builder</h1>
        <p className="text-gray-600">Create interactive dashboards with drag-and-drop</p>
      </div>
      <DashboardBuilder dashboardId="demo" />
    </div>
  )
}
