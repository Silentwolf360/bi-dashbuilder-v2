import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/authorization"
import { roleService } from "@/lib/role.service"
import { z } from "zod"

const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const roles = await roleService.listRoles()
    return NextResponse.json({ success: true, data: roles })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await request.json()
    const validated = createRoleSchema.parse(body)
    const role = await roleService.createRole(validated)
    return NextResponse.json({ success: true, data: role })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
