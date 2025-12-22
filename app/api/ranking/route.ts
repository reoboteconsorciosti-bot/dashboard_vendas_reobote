import { NextResponse } from "next/server"
import { getCachedSalesData } from "@/lib/mock-data"
import { filterSalesData, calculateRanking } from "@/lib/data-processor"
import type { DashboardFilters } from "@/lib/types"
import { rateLimit, sanitizeInput } from "@/lib/rate-limiter"

/**
 * GET /api/ranking
 * Returns ranking of sellers with security and rate limiting
 * Query params: mes, ano, consultor, administradora
 */
export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    if (!rateLimit(ip, 100, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)

    const filters: DashboardFilters = {
      mes: searchParams.get("mes") ? Number.parseInt(searchParams.get("mes")!) : undefined,
      ano: searchParams.get("ano") ? Number.parseInt(searchParams.get("ano")!) : undefined,
      consultor: searchParams.get("consultor") ? sanitizeInput(searchParams.get("consultor")!) : undefined,
      administradora: searchParams.get("administradora")
        ? sanitizeInput(searchParams.get("administradora")!)
        : undefined,
    }

    if (filters.mes && (filters.mes < 1 || filters.mes > 12)) {
      return NextResponse.json({ error: "Invalid month" }, { status: 400 })
    }
    if (filters.ano && (filters.ano < 2000 || filters.ano > 2100)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 })
    }

    // In production, replace this with n8n webhook call
    // const response = await fetch(process.env.N8N_WEBHOOK_URL!, {
    //   headers: { Authorization: `Bearer ${process.env.N8N_WEBHOOK_TOKEN}` }
    // })
    // const salesData = await response.json()

    const salesData = getCachedSalesData()
    const filteredData = filterSalesData(salesData, filters)
    const ranking = calculateRanking(filteredData)

    return NextResponse.json({
      ranking,
      total: ranking.length,
      filters: filters,
    })
  } catch (error) {
    console.error("Error in /api/ranking:", error)
    return NextResponse.json({ error: "Failed to fetch ranking" }, { status: 500 })
  }
}
