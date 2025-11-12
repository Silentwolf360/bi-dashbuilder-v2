import RoleManagement from "@/components/roles/management"

export default function RolesPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Roles</h1>
        <p className="text-gray-600">Manage roles and permissions</p>
      </div>
      <RoleManagement />
    </div>
  )
}
