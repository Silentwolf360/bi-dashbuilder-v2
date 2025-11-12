import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import prisma from "./prisma"
import { ResourceType, PermissionType } from "@prisma/client"
import { parseFilterExpression } from "./utils"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function hasPermission(
  userId: string,
  resourceType: ResourceType,
  resourceId: string | null,
  requiredPermission: PermissionType
): Promise<boolean> {
  // Get user's roles
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  })

  // Check permissions
  for (const userRole of userRoles) {
    for (const permission of userRole.role.permissions) {
      // Check if permission matches resource type
      if (permission.resourceType !== resourceType) continue

      // Check if permission applies to this specific resource or all resources
      if (permission.resourceId && permission.resourceId !== resourceId) continue

      // Check permission level
      const permissionLevel = getPermissionLevel(permission.permission)
      const requiredLevel = getPermissionLevel(requiredPermission)

      if (permissionLevel >= requiredLevel) {
        return true
      }
    }
  }

  return false
}

function getPermissionLevel(permission: PermissionType): number {
  switch (permission) {
    case "VIEW":
      return 1
    case "EDIT":
      return 2
    case "MANAGE":
      return 3
    case "DELETE":
      return 4
    default:
      return 0
  }
}

export async function getUserDataFilters(userId: string): Promise<any> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      },
    },
  })

  if (!user) return {}

  // Collect all data filters from user's roles
  const dataFilters: any = {}

  for (const userRole of user.roles) {
    for (const permission of userRole.role.permissions) {
      if (permission.dataFilters) {
        Object.assign(dataFilters, permission.dataFilters)
      }
    }
  }

  // Add user-specific filters
  if (user.region) dataFilters.region = user.region
  if (user.department) dataFilters.department = user.department
  if (user.agentCode) dataFilters.agentCode = user.agentCode

  return dataFilters
}

export async function checkConditionalAccess(
  userId: string,
  conditions: any
): Promise<boolean> {
  if (!conditions) return true

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  })

  if (!user) return false

  const userContext = {
    user: {
      id: user.id,
      email: user.email,
      region: user.region,
      department: user.department,
      agentCode: user.agentCode,
      roles: user.roles.map((r) => r.role.name),
    },
  }

  // Evaluate conditions
  if (Array.isArray(conditions)) {
    // Multiple conditions (AND logic)
    return conditions.every((condition) =>
      evaluateCondition(condition, userContext)
    )
  } else {
    return evaluateCondition(conditions, userContext)
  }
}

function evaluateCondition(condition: any, context: any): boolean {
  const { field, operator, value } = condition

  const expression = `${field} ${operator} '${value}'`
  return parseFilterExpression(expression, context) === true
}

export async function canAccessDashboard(
  userId: string,
  dashboardId: string
): Promise<boolean> {
  // Check if user has explicit access
  const access = await prisma.dashboardAccess.findFirst({
    where: {
      dashboardId,
      OR: [{ userId }, { roleId: { in: await getUserRoleIds(userId) } }],
      canView: true,
    },
  })

  return !!access
}

export async function canEditDashboard(
  userId: string,
  dashboardId: string
): Promise<boolean> {
  const access = await prisma.dashboardAccess.findFirst({
    where: {
      dashboardId,
      OR: [{ userId }, { roleId: { in: await getUserRoleIds(userId) } }],
      canEdit: true,
    },
  })

  return !!access
}

export async function getUserRoleIds(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    select: { roleId: true },
  })

  return userRoles.map((ur) => ur.roleId)
}

export async function applyDataFiltersToQuery(
  userId: string,
  baseQuery: any
): Promise<any> {
  const dataFilters = await getUserDataFilters(userId)

  // Merge data filters into query WHERE clause
  if (Object.keys(dataFilters).length > 0) {
    baseQuery.where = {
      ...baseQuery.where,
      ...dataFilters,
    }
  }

  return baseQuery
}

export async function logAuditEvent(
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: any
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action: action as any,
      resourceType,
      resourceId,
      details,
    },
  })
}
