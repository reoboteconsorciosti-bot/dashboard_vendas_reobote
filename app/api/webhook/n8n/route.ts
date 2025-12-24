import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { z } from "zod"

// --- CONSTANTS ---
const N8N_TOKEN = process.env.N8N_WEBHOOK_TOKEN

// --- HELPER: Flexible Key Extractor ---
// Finds a value in an object using multiple possible key names (case insensitive, ignoring symbols)
const findValue = (obj: any, keys: string[]) => {
  if (!obj || typeof obj !== 'object') return undefined
  const objKeys = Object.keys(obj)
  for (const targetKey of keys) {
    // Direct match
    if (obj[targetKey] !== undefined) return obj[targetKey]

    // Fuzzy match
    const found = objKeys.find(k =>
      k.toLowerCase().replace(/[^a-z0-9]/g, "") === targetKey.toLowerCase().replace(/[^a-z0-9]/g, "")
    )
    if (found) return obj[found]
  }
  return undefined
}

// --- HELPER: Parsers ---
function parseDecimal(value: any): number {
  if (typeof value === "number") return value
  if (!value) return 0
  let str = String(value).trim().replace(/[R$\s]/g, "")
  // Handle BR format (1.000,00) vs US format (1,000.00)
  if (str.includes(",") && str.includes(".")) {
    if (str.lastIndexOf(".") < str.lastIndexOf(",")) { // BR 1.234,56
      str = str.replace(/\./g, "").replace(",", ".")
    } else { // US 1,234.56
      str = str.replace(/,/g, "")
    }
  } else if (str.includes(",")) {
    str = str.replace(",", ".") // Assume comma is decimal
  }
  const result = parseFloat(str)
  return isNaN(result) ? 0 : result
}

function parseDate(value: any): Date | null {
  if (!value) return null
  // Try standard date
  const date = new Date(value)
  if (!isNaN(date.getTime())) return date

  // Try BR format DD/MM/YYYY
  if (typeof value === "string" && value.includes("/")) {
    const parts = value.split("/")
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const yearPart = parts[2].split(" ")[0]
      const year = parseInt(yearPart, 10)
      const brDate = new Date(year, month, day)
      if (!isNaN(brDate.getTime())) return brDate
    }
  }
  return null
}

// --- ZOD SCHEMA ---
const SaleSchema = z.object({
  consultorNome: z.string().min(2, "Nome muito curto").trim(),
  administradora: z.string().min(1, "Administradora obrigatória").trim().toUpperCase(),
  grupo: z.string().min(1, "Grupo obrigatório").trim(),
  cota: z.string().min(1, "Cota obrigatória").trim(),
  valorLiquido: z.preprocess((val) => parseDecimal(val), z.number().refine(n => n >= 0, "Valor líquido não pode ser negativo")),
  valorBruto: z.preprocess((val) => parseDecimal(val), z.number().refine(n => n >= 0, "Valor bruto não pode ser negativo")),
  dataVenda: z.preprocess((val) => parseDate(val), z.date({ required_error: "Data inválida ou ausente" })),
  mesCompetencia: z.string().optional()
})

// --- MAIN ROUTE ---
export async function POST(request: Request) {
  const PROCESS_ID = Date.now().toString(36).slice(-6)
  console.log(`[Webhook ${PROCESS_ID}] START`)

  try {
    // 1. Auth
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "").trim()
    if (!N8N_TOKEN || token !== N8N_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Parse Body
    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

    // 3. Normalize to Array
    let items: any[] = []
    if (Array.isArray(body)) items = body
    else if (body.vendas && Array.isArray(body.vendas)) items = body.vendas
    else items = [body]

    if (items.length === 0) return NextResponse.json({ error: "Empty payload" }, { status: 400 })

    console.log(`[Webhook ${PROCESS_ID}] Processing batch of ${items.length} items`)

    // 4. Batch Processing (All Settled)
    const results = await Promise.allSettled(items.map(async (rawItem, index) => {
      // 4.1 Extract & Normalize
      const normalizedData = {
        consultorNome: findValue(rawItem, ["consultorNome", "consultor", "nomeConsultor"]),
        administradora: findValue(rawItem, ["administradora", "adm"]),
        grupo: findValue(rawItem, ["grupo", "nr_grupo"]),
        cota: findValue(rawItem, ["cota", "nr_cota"]),
        valorLiquido: findValue(rawItem, ["valorLiquido", "valor_liquido"]),
        valorBruto: findValue(rawItem, ["valorBruto", "valor_bruto"]),
        dataVenda: findValue(rawItem, ["dataVenda", "data_venda", "data"]),
        mesCompetencia: findValue(rawItem, ["mesCompetencia", "mes_competencia"])
      }

      // 4.2 Validate with Zod
      const parsed = SaleSchema.parse(normalizedData)

      // 4.3 Derive missing fields
      const mesCompetencia = parsed.mesCompetencia || `${parsed.dataVenda.getMonth() + 1}/${parsed.dataVenda.getFullYear()}`

      // 4.4 DB Upsert (Manual Check due to missing Unique Constraint)
      // We manually check for duplicates to avoid relying on the DB constraint which we removed for legacy support.

      const existingSale = await prisma.sale.findFirst({
        where: {
          administradora: parsed.administradora,
          grupo: parsed.grupo,
          cota: parsed.cota
        }
      })

      let sale;

      if (existingSale) {
        // UPDATE existing
        sale = await prisma.sale.update({
          where: { id: existingSale.id },
          data: {
            consultorNome: parsed.consultorNome,
            valorLiquido: parsed.valorLiquido,
            valorBruto: parsed.valorBruto,
            dataVenda: parsed.dataVenda,
            mesCompetencia: mesCompetencia,
          }
        })
      } else {
        // CREATE new
        sale = await prisma.sale.create({
          data: {
            consultorNome: parsed.consultorNome,
            administradora: parsed.administradora,
            grupo: parsed.grupo,
            cota: parsed.cota,
            valorLiquido: parsed.valorLiquido,
            valorBruto: parsed.valorBruto,
            dataVenda: parsed.dataVenda,
            mesCompetencia: mesCompetencia,
          }
        })
      }
      return sale
    }))

    // 5. Aggregate Results
    const successes = results.filter(r => r.status === 'fulfilled').length
    const failures = results.filter(r => r.status === 'rejected').map((r: any, idx) => {
      // Try to extract useful error message
      let msg = "Unknown error"
      if (r.reason instanceof z.ZodError) {
        msg = r.reason.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(", ")
      } else if (r.reason instanceof Error) {
        msg = r.reason.message
      }
      return {
        item_index: idx, // Note: index in filtered array might not match original unless mapped carefully, but logic above maps promises 1:1
        // Actually to get correct index we need to map over the original 'items' array.
        // But wait, results array maps 1:1 to items array order because Promise.allSettled preserves order.
        // So I need to find the index in 'results'.
        error: msg
      }
    })

    // More precise mapping for failure details
    const detailedFailures = results.map((r, idx) => {
      if (r.status === 'fulfilled') return null
      let msg = "Erro desconhecido"
      if (r.reason instanceof z.ZodError) {
        msg = r.reason.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(", ")
      } else if (r.reason instanceof Error) {
        msg = r.reason.message
      } else {
        msg = String(r.reason)
      }
      return {
        item_index: idx,
        erro: msg,
        dados_parciais: items[idx] // Return raw data to help debugging
      }
    }).filter(Boolean)

    console.log(`[Webhook ${PROCESS_ID}] DONE. Success: ${successes}, Failures: ${detailedFailures.length}`)

    // 6. Cache Revalidation
    if (successes > 0) {
      revalidatePath("/")
      revalidatePath("/tv-ranking")
      revalidatePath("/analytics")
    }

    return NextResponse.json({
      total_recebido: items.length,
      sucessos: successes,
      falhas: detailedFailures.length,
      detalhes_falhas: detailedFailures
    }, { status: 200 }) // Always 200 to not break n8n flow, it receives the report

  } catch (error) {
    console.error(`[Webhook ${PROCESS_ID}] CRITICAL SYSTEM ERROR`, error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

