import { NextRequest, NextResponse } from "next/server"
import { requireAuth, applyDataFiltersToQuery } from "@/lib/authorization"
import { metricService } from "@/lib/metric.service"
import { generateQueryHash } from "@/lib/utils"
import prisma from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    
    const { filters, groupBy, dateField } = body

    // Apply user data filters
    const userFilters = await applyDataFiltersToQuery(user.id, { where: filters })
    const mergedFilters = userFilters.where

    // Check cache
    const queryHash = generateQueryHash({
      metricId: params.id,
      filters: mergedFilters,
      groupBy,
      dateField,
    })

    const cached = await prisma.queryCache.findUnique({
      where: { queryHash },
    })

    if (cached && cached.expiresAt > new Date()) {
      return NextResponse.json({
        success: true,
        data: cached.result,
        cached: true,
      })
    }

    // Execute metric
    const result = await metricService.executeMetric(
      params.id,
      mergedFilters,
      groupBy,
      dateField
    )

    // Cache result (5 minutes)
    await prisma.queryCache.upsert({
      where: { queryHash },
      create: {
        queryHash,
        result: result as any,
        dataSourceId: null,
        metricIds: [params.id],
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
      update: {
        result: result as any,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    })

    return NextResponse.json({
      success: true,
      data: result,
      cached: false,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
