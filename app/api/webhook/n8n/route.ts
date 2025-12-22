import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { validateWebhookToken, rateLimit, logAudit } from "@/lib/rate-limiter"
import { parseMesAno, parseDataVenda, parseValor } from "@/lib/date-converter"
import type { SalesData } from "@/lib/types"

/**
 * POST /api/webhook/n8n
 * Webhook otimizado para processar vendas em lote da planilha Google Sheets
 *
 * Aceita até 5000 vendas por requisição
 *
 * Formato esperado (seus dados da planilha):
 * {
 *   "vendas": [
 *     {
 *       "consultor": "RAPHAEL",
 *       "administradora": "SERVOPA",
 *       "valor_liquido": "55000",
 *       "valor_bruto": "110000",
 *       "data_venda": "17/12/2025",
 *       "mes_ano": "dezembro-2025"
 *     }
 *   ]
 * }
 */
export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    if (!rateLimit(ip, 100, 60000)) {
      logAudit({
        action: "create",
        resource: "webhook",
        details: `Rate limit exceeded from IP: ${ip}`,
      })
      return NextResponse.json({ error: "Muitas requisições. Aguarde 1 minuto." }, { status: 429 })
    }

    // Validate authentication token
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || null

    // Check against env var
    if (token !== process.env.N8N_WEBHOOK_TOKEN) {
      logAudit({
        action: "create",
        resource: "webhook",
        details: `Tentativa não autorizada de IP: ${ip}`,
      })
      return NextResponse.json({ error: "Token de autenticação inválido" }, { status: 401 })
    }

    // Parse payload
    const payload = await request.json()
    const isRealTime = payload.vendas?.length === 1

    if (!payload.vendas || !Array.isArray(payload.vendas)) {
      return NextResponse.json(
        { error: "Formato inválido. Esperado: { vendas: [...] }" },
        { status: 400 }
      )
    }

    // Processar e validar cada venda
    const vendasProcessadas: SalesData[] = []
    const erros: Array<{ linha: number; erro: string; dados: any }> = []

    // Use transaction for batch safety if needed, but for now sequential is fine or Promise.all
    // For better error handling in the loop, we'll try/catch each

    for (let index = 0; index < payload.vendas.length; index++) {
      const venda = payload.vendas[index];
      try {
        const mesAnoParseado = parseMesAno(venda.mes_ano)
        if (!mesAnoParseado) throw new Error(`mes_ano inválido: ${venda.mes_ano}`)

        const dataVendaISO = parseDataVenda(venda.data_venda)
        if (!dataVendaISO) throw new Error(`data_venda inválida: ${venda.data_venda}`)

        const valorBruto = parseValor(venda.valor_bruto)
        const valorLiquido = parseValor(venda.valor_liquido)

        if (!venda.consultor?.trim()) throw new Error("consultor obrigatório")
        if (!venda.administradora?.trim()) throw new Error("administradora obrigatória")

        // Create in Database
        const createdSale = await prisma.sale.create({
          data: {
            consultorNome: venda.consultor.trim(),
            administradora: venda.administradora.trim(),
            valorLiquido: valorLiquido,
            valorBruto: valorBruto,
            dataVenda: new Date(dataVendaISO),
            mesCompetencia: venda.mes_ano,
          }
        })

        vendasProcessadas.push({
          ...createdSale,
          id: createdSale.id,
          consultorId: createdSale.consultorNome, // fallback
          mes: mesAnoParseado.mes,
          ano: mesAnoParseado.ano,
          dataVenda: createdSale.dataVenda.toISOString(),
          valorLiquido: Number(createdSale.valorLiquido),
          valorBruto: Number(createdSale.valorBruto),
          status: 'confirmado'
        })

      } catch (error) {
        erros.push({
          linha: index + 1,
          erro: error instanceof Error ? error.message : "Erro desconhecido",
          dados: venda,
        })
      }
    }

    // Revalidate the dashboard
    revalidatePath('/')

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      total_recebido: payload.vendas.length,
      total_processado: vendasProcessadas.length,
      total_erros: erros.length,
      tempo_processamento_ms: processingTime,
      ...(erros.length > 0 && { erros: erros.slice(0, 10) }),
    })

  } catch (error) {
    console.error("[Webhook] Erro crítico:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", detalhes: error instanceof Error ? error.message : "Desconhecido" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    {
      endpoint: "/api/webhook/n8n",
      method: "POST",
      description: "Webhook para receber vendas do Google Sheets via n8n",
      formato_esperado: {
        vendas: [
          {
            consultor: "NOME DO CONSULTOR",
            administradora: "NOME DA ADMINISTRADORA",
            valor_liquido: "55000",
            valor_bruto: "110000",
            data_venda: "17/12/2025",
            mes_ano: "dezembro-2025",
          },
        ],
      },
      limites: {
        max_vendas_por_requisicao: 5000,
        rate_limit: "100 requisições por minuto",
      },
      autenticacao: {
        tipo: "Bearer Token",
        header: "Authorization: Bearer (Configurado nas Variáveis de Ambiente)",
        variavel_ambiente: "N8N_WEBHOOK_TOKEN",
      },
    },
    { status: 200 },
  )
}
