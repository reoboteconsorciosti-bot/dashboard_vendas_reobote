import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
    try {
        // Security check: You might want to protect this with a token or check for local env only,
        // but for now we'll allow it for the user to fix their DB.
        // Ideally, pass ?token=YOUR_N8N_TOKEN

        const { searchParams } = new URL(request.url)
        const token = searchParams.get("token")
        const n8nToken = process.env.N8N_WEBHOOK_TOKEN

        if (!n8nToken || token !== n8nToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const deleted = await prisma.sale.deleteMany({})

        return NextResponse.json({
            success: true,
            count: deleted.count,
            message: `Database cleared. ${deleted.count} sales records created.`
        })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
