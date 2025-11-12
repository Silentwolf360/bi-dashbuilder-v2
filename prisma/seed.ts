import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const password = await hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password,
      name: 'Admin User',
      isActive: true,
    },
  })

  // Create roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'Administrator',
      description: 'Full system access',
      isSystem: true,
    },
  })

  const analystRole = await prisma.role.create({
    data: {
      name: 'Analyst',
      description: 'Can create dashboards and metrics',
      isSystem: false,
    },
  })

  const viewerRole = await prisma.role.create({
    data: {
      name: 'Viewer',
      description: 'Can only view dashboards',
      isSystem: false,
    },
  })

  // Assign admin role
  await prisma.userRole.create({
    data: {
      userId: admin.id,
      roleId: adminRole.id,
    },
  })

  // Create sample regional manager
  const rmPassword = await hash('password123', 10)
  const regionalManager = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      password: rmPassword,
      name: 'Regional Manager',
      department: 'Sales',
      region: 'North',
      isActive: true,
    },
  })

  await prisma.userRole.create({
    data: {
      userId: regionalManager.id,
      roleId: analystRole.id,
    },
  })

  console.log('Database seeded successfully!')
  console.log('Admin: admin@example.com / admin123')
  console.log('Manager: manager@example.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
