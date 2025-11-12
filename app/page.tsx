import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart3, Database, Calculator, Layout, Lock } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="text-center py-16">
          <h1 className="text-5xl font-bold mb-4">BI Dashboard Builder</h1>
          <p className="text-xl text-gray-600 mb-8">
            Build powerful analytics dashboards with no code
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg">
                <Lock className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Database className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Data Sources</h3>
            <p className="text-gray-600">Upload and manage your data</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <Calculator className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Metrics</h3>
            <p className="text-gray-600">Define KPIs and calculations</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <Layout className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Dashboards</h3>
            <p className="text-gray-600">Build interactive dashboards</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <BarChart3 className="w-12 h-12 text-orange-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">View Reports</h3>
            <p className="text-gray-600">Access your dashboards</p>
          </div>
        </div>

        <div className="mt-16 bg-white rounded-lg p-8 shadow-md">
          <h2 className="text-2xl font-bold mb-4">Features</h2>
          <ul className="grid md:grid-cols-2 gap-4">
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Upload CSV, Excel, JSON files</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Auto schema detection</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Time intelligence (YTD, MOM, YOY)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Drag-and-drop dashboard builder</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Role-based access control</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Interactive charts (Line, Bar, Pie, KPI)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
