import UserManagement from "@/components/users/management"

export default function UsersPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-gray-600">Manage user accounts and access</p>
      </div>
      <UserManagement />
    </div>
  )
}
