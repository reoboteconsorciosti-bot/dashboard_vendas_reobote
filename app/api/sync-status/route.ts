import { NextResponse } from "next/server"
import { getSyncInfo } from "@/lib/mock-data"

/**
 * GET /api/sync-status
 * Retorna status da sincronização com o webhook
 */
export async function GET() {
  try {
    const syncInfo = getSyncInfo()

    return NextResponse.json({
      status: syncInfo.hasRealData ? "connected" : "mock",
      lastSync: syncInfo.lastSync,
      totalVendas: syncInfo.totalVendas,
      message: syncInfo.hasRealData
        ? "Conectado ao Google Sheets via n8n"
        : "Usando dados de demonstração. Configure o webhook para ver dados reais.",
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Erro ao verificar status de sincronização",
      },
      { status: 500 },
    )
  }
}
