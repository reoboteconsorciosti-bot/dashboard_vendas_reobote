import { NextResponse } from "next/server"
import { getCachedSalesData } from "@/lib/mock-data"
import { filterSalesData, calculateStats } from "@/lib/data-processor"
import type { DashboardFilters } from "@/lib/types"

/**
 * GET /api/stats
 * Returns aggregated statistics
 * Query params: mes, ano, consultor, administradora
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const filters: DashboardFilters = {
      mes: searchParams.get("mes") ? Number.parseInt(searchParams.get("mes")!) : undefined,
      ano: searchParams.get("ano") ? Number.parseInt(searchParams.get("ano")!) : undefined,
      consultor: searchParams.get("consultor") || undefined,
      administradora: searchParams.get("administradora") || undefined,
    }

    // In production, replace this with n8n webhook call
    const salesData = getCachedSalesData()
    const filteredData = filterSalesData(salesData, filters)
    const stats = calculateStats(filteredData)

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] Error in /api/stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
