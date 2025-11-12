"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LayoutDashboard, Database, Calculator, Users, Shield, BarChart3, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold">BI Dashboard</h2>
          <p className="text-sm text-gray-400">Admin Panel</p>
        </div>
        <nav className="space-y-1 px-3 flex-1">
          <Link href="/admin/dashboards">
            <div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 cursor-pointer">
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboards</span>
            </div>
          </Link>
          <Link href="/admin/data-sources">
            <div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 cursor-pointer">
              <Database className="w-5 h-5" />
              <span>Data Sources</span>
            </div>
          </Link>
          <Link href="/admin/metrics">
            <div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 cursor-pointer">
              <Calculator className="w-5 h-5" />
              <span>Metrics</span>
            </div>
          </Link>
          <Link href="/admin/users">
            <div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 cursor-pointer">
              <Users className="w-5 h-5" />
              <span>Users</span>
            </div>
          </Link>
          <Link href="/admin/roles">
            <div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 cursor-pointer">
              <Shield className="w-5 h-5" />
              <span>Roles</span>
            </div>
          </Link>
          <Link href="/dashboards">
            <div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 cursor-pointer">
              <BarChart3 className="w-5 h-5" />
              <span>View Dashboards</span>
            </div>
          </Link>
        </nav>
        
        {/* User Info & Sign Out */}
        <div className="p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400 mb-2">
            {session?.user?.email}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
    </div>
  )
}
