import prisma from "./prisma"
import { ResourceType, PermissionType } from "@prisma/client"

export class RoleService {
  async createRole(data: { name: string; description?: string }) {
    return await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        isSystem: false,
      },
    })
  }

  async listRoles() {
    return await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true, permissions: true },
        },
      },
      orderBy: { name: "asc" },
    })
  }

  async getRole(id: string) {
    return await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
        users: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    })
  }

  async updateRole(id: string, data: { name?: string; description?: string }) {
    return await prisma.role.update({
      where: { id },
      data,
    })
  }

  async deleteRole(id: string) {
    const role = await prisma.role.findUnique({ where: { id } })
    if (role?.isSystem) {
      throw new Error("Cannot delete system role")
    }
    return await prisma.role.delete({ where: { id } })
  }

  async addPermission(data: {
    roleId: string
    resourceType: ResourceType
    resourceId?: string
    permission: PermissionType
    dataFilters?: any
    conditions?: any
  }) {
    return await prisma.permission.create({
      data: {
        roleId: data.roleId,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        permission: data.permission,
        dataFilters: data.dataFilters,
        conditions: data.conditions,
      },
    })
  }

  async removePermission(permissionId: string) {
    return await prisma.permission.delete({ where: { id: permissionId } })
  }

  async getRolePermissions(roleId: string) {
    return await prisma.permission.findMany({
      where: { roleId },
      orderBy: { resourceType: "asc" },
    })
  }
}

export const roleService = new RoleService()
