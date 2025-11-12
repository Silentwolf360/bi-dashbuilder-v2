import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/authorization"
import { userService } from "@/lib/user.service"
import { z } from "zod"

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  department: z.string().optional(),
  region: z.string().optional(),
  agentCode: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const { searchParams } = new URL(request.url)
    
    const filters: any = {}
    if (searchParams.get("department")) filters.department = searchParams.get("department")
    if (searchParams.get("region")) filters.region = searchParams.get("region")
    if (searchParams.get("isActive")) filters.isActive = searchParams.get("isActive") === "true"

    const users = await userService.listUsers(filters)
    return NextResponse.json({ success: true, data: users })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await request.json()
    const validated = createUserSchema.parse(body)
    const user = await userService.createUser(validated)
    return NextResponse.json({ success: true, data: user })
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
