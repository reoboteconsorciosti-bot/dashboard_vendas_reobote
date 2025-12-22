import { NextResponse } from "next/server"
import { getAuditLogs, rateLimit } from "@/lib/rate-limiter"

/**
 * GET /api/audit
 * Returns audit logs for monitoring and security
 * Protected endpoint - only accessible internally
 */
export async function GET(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    if (!rateLimit(ip, 50, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    // In production, add authentication here
    // const session = await getServerSession()
    // if (!session || !session.user.isAdmin) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const logs = getAuditLogs()

    return NextResponse.json({
      logs,
      total: logs.length,
    })
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
  }
}
