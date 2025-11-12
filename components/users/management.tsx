"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Edit, Trash2 } from "lucide-react"

interface User {
  id: string
  email: string
  name?: string
  department?: string
  region?: string
  agentCode?: string
  isActive: boolean
  roles: Array<{ role: { id: string; name: string } }>
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    department: "",
    region: "",
    agentCode: "",
    roleIds: [] as string[],
  })

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const fetchUsers = async () => {
    const res = await fetch("/api/users")
    const data = await res.json()
    if (data.success) setUsers(data.data)
  }

  const fetchRoles = async () => {
    const res = await fetch("/api/roles")
    const data = await res.json()
    if (data.success) setRoles(data.data)
  }

  const handleCreate = async () => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
    const result = await res.json()
    if (result.success) {
      setShowModal(false)
      fetchUsers()
      setFormData({ email: "", password: "", name: "", department: "", region: "", agentCode: "", roleIds: [] })
    } else {
      alert(result.error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>User Management</CardTitle>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Region</th>
                  <th className="px-4 py-3 text-left">Roles</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.name || "-"}</td>
                    <td className="px-4 py-3">{user.department || "-"}</td>
                    <td className="px-4 py-3">{user.region || "-"}</td>
                    <td className="px-4 py-3">
                      {user.roles.map(r => r.role.name).join(", ") || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px] p-6">
            <h3 className="text-lg font-semibold mb-4">Create User</h3>
            <div className="space-y-4">
              <Input
                placeholder="Email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
              <Input
                placeholder="Name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                placeholder="Department"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
              />
              <Input
                placeholder="Region"
                value={formData.region}
                onChange={e => setFormData({ ...formData, region: e.target.value })}
              />
              <Input
                placeholder="Agent Code"
                value={formData.agentCode}
                onChange={e => setFormData({ ...formData, agentCode: e.target.value })}
              />
              <div>
                <label className="text-sm font-medium">Roles</label>
                <div className="border rounded p-3 space-y-2 max-h-40 overflow-y-auto">
                  {roles.map(role => (
                    <label key={role.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.roleIds.includes(role.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setFormData({ ...formData, roleIds: [...formData.roleIds, role.id] })
                          } else {
                            setFormData({ ...formData, roleIds: formData.roleIds.filter(id => id !== role.id) })
                          }
                        }}
                      />
                      <span className="text-sm">{role.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
