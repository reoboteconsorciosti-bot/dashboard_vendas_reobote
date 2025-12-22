import { NextResponse } from "next/server"
import { getCachedSalesData } from "@/lib/mock-data"
import { getUniqueConsultores, getUniqueAdministradoras } from "@/lib/data-processor"

/**
 * GET /api/filters
 * Returns available filter options
 */
export async function GET() {
  try {
    const salesData = getCachedSalesData()

    const consultores = getUniqueConsultores(salesData)
    const administradoras = getUniqueAdministradoras(salesData)

    return NextResponse.json({
      consultores,
      administradoras,
    })
  } catch (error) {
    console.error("[v0] Error in /api/filters:", error)
    return NextResponse.json({ error: "Failed to fetch filter options" }, { status: 500 })
  }
}
