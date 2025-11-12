import prisma from "./prisma"
import { hash } from "bcryptjs"

export class UserService {
  async createUser(data: {
    email: string
    password: string
    name?: string
    department?: string
    region?: string
    agentCode?: string
    roleIds?: string[]
  }) {
    const hashedPassword = await hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        department: data.department,
        region: data.region,
        agentCode: data.agentCode,
      },
    })

    if (data.roleIds && data.roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: data.roleIds.map(roleId => ({
          userId: user.id,
          roleId,
        })),
      })
    }

    return user
  }

  async listUsers(filters?: { department?: string; region?: string; isActive?: boolean }) {
    return await prisma.user.findMany({
      where: filters,
      include: {
        roles: {
          include: { role: true },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        region: true,
        agentCode: true,
        isActive: true,
        createdAt: true,
        roles: {
          include: { role: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  async updateUser(userId: string, data: {
    name?: string
    department?: string
    region?: string
    isActive?: boolean
  }) {
    return await prisma.user.update({
      where: { id: userId },
      data,
    })
  }

  async assignRoles(userId: string, roleIds: string[]) {
    await prisma.userRole.deleteMany({ where: { userId } })
    
    if (roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map(roleId => ({ userId, roleId })),
      })
    }
  }

  async deactivateUser(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    })
  }
}

export const userService = new UserService()
