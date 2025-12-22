import { NextResponse } from "next/server"
import { updateUser, deleteUser, getUsers } from "@/lib/user-storage"
import { rateLimit, sanitizeInput, logAudit } from "@/lib/rate-limiter"

export const dynamic = "force-dynamic"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    if (!rateLimit(ip, 20, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const { id } = await params
    const data = await request.json()

    if (data.sheetName) data.sheetName = sanitizeInput(data.sheetName)
    if (data.displayName) data.displayName = sanitizeInput(data.displayName)

    const result = await updateUser(id, data)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    logAudit({
      action: "update",
      resource: "user",
      details: `Updated user: ${result.user?.displayName} (${result.user?.sheetName})`,
    })

    return NextResponse.json(result.user)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    if (!rateLimit(ip, 10, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const { id } = await params

    const users = await getUsers()
    const userToDelete = users.find((u) => u.id === id)

    const result = await deleteUser(id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    if (userToDelete) {
      logAudit({
        action: "delete",
        resource: "user",
        details: `Deleted user: ${userToDelete.displayName} (${userToDelete.sheetName})`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Erro ao excluir usuário" }, { status: 500 })
  }
}
