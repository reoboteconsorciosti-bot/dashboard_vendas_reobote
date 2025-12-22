import { NextResponse } from "next/server"
import { getAllUsers, createUser } from "@/lib/user-storage"
import { rateLimit, sanitizeInput, logAudit } from "@/lib/rate-limiter"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    if (!rateLimit(ip, 50, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const users = await getAllUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    if (!rateLimit(ip, 20, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const data = await request.json()

    if (data.sheetName) data.sheetName = sanitizeInput(data.sheetName)
    if (data.displayName) data.displayName = sanitizeInput(data.displayName)

    if (!data.sheetName || !data.displayName) {
      return NextResponse.json({ error: "Nome da planilha e nome de exibição são obrigatórios" }, { status: 400 })
    }

    const result = await createUser(data)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    logAudit({
      action: "create",
      resource: "user",
      details: `Created user: ${data.displayName} (${data.sheetName})`,
    })

    return NextResponse.json(result.user, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
  }
}
