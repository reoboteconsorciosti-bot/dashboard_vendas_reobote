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
    let rawItems: any[] = []
    if (Array.isArray(body)) rawItems = body
    else if (body.vendas && Array.isArray(body.vendas)) rawItems = body.vendas
    else rawItems = [body]

    if (rawItems.length === 0) return NextResponse.json({ error: "Empty payload" }, { status: 400 })

    console.log(`[Webhook ${PROCESS_ID}] Processing batch of ${rawItems.length} items`)

    // 4. PRE-PROCESSING: Parse & Validate all items
    // We map them to a standard structure to allow bulk operations
    const parsedItems: {
      success: boolean;
      data?: z.infer<typeof SaleSchema> & { key: string };
      error?: string;
      originalIndex: number
    }[] = rawItems.map((rawItem, index) => {
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

      const result = SaleSchema.safeParse(normalizedData)

      if (!result.success) {
        return {
          success: false,
          error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", "),
          originalIndex: index
        }
      }

      const parsed = result.data
      const mesCompetencia = parsed.mesCompetencia || `${parsed.dataVenda.getMonth() + 1}/${parsed.dataVenda.getFullYear()}`

      return {
        success: true,
        data: {
          ...parsed,
          mesCompetencia,
          // Create a unique key for matching: Adm+Grupo+Cota
          key: `${parsed.administradora}-${parsed.grupo}-${parsed.cota}`
        },
        originalIndex: index
      }
    })

    const validItems = parsedItems.filter(i => i.success && i.data).map(i => i.data!)

    // If everything failed, return early
    if (validItems.length === 0) {
      const failures = parsedItems.map(i => ({
        item_index: i.originalIndex,
        erro: i.error,
        dados_parciais: rawItems[i.originalIndex]
      }))
      return NextResponse.json({
        total_recebido: rawItems.length,
        sucessos: 0,
        falhas: rawItems.length,
        detalhes_falhas: failures
      }, { status: 200 })
    }

    // 5. BULK LOOKUP
    // Find all existing records that match our keys
    const matchConditions = validItems.map(item => ({
      administradora: item.administradora,
      grupo: item.grupo,
      cota: item.cota
    }))

    // Use findMany with OR to get them all in one shot
    const existingRecords = await prisma.sale.findMany({
      where: {
        OR: matchConditions
      },
      select: {
        id: true,
        administradora: true,
        grupo: true,
        cota: true
      }
    })

    // Create a Map for fast O(1) checking
    // Key: "ADM-GRUPO-COTA" -> ID
    const existingMap = new Map<string, string>()
    existingRecords.forEach(rec => {
      existingMap.set(`${rec.administradora}-${rec.grupo}-${rec.cota}`, rec.id)
    })

    // 6. CLASSIFY: Create vs Update
    const toCreate: any[] = []
    const toUpdate: any[] = []

    // Deduplication within the batch:
    // If the input JSON has the same cota twice, we only process the LAST one (latest state).
    const uniqueBatchItems = new Map<string, typeof validItems[0]>()
    validItems.forEach(item => {
      uniqueBatchItems.set(item.key, item)
    })

    for (const item of uniqueBatchItems.values()) {
      const existingId = existingMap.get(item.key)

      const payload = {
        consultorNome: item.consultorNome,
        administradora: item.administradora,
        grupo: item.grupo,
        cota: item.cota,
        valorLiquido: item.valorLiquido,
        valorBruto: item.valorBruto,
        dataVenda: item.dataVenda,
        mesCompetencia: item.mesCompetencia
      }

      if (existingId) {
        toUpdate.push({
          where: { id: existingId },
          data: payload
        })
      } else {
        toCreate.push(payload)
      }
    }

    console.log(`[Webhook ${PROCESS_ID}] Plan: Create ${toCreate.length}, Update ${toUpdate.length}`)

    // 7. EXECUTE DB OPERATIONS
    try {
      await prisma.$transaction([
        // Batch Insert
        ...(toCreate.length > 0 ? [prisma.sale.createMany({ data: toCreate })] : []),
        // Batch Updates (must be individual promises in transaction)
        ...toUpdate.map(upd => prisma.sale.update(upd))
      ])
    } catch (dbError) {
      console.error(`[Webhook ${PROCESS_ID}] Transaction failed`, dbError)
      return NextResponse.json({ error: "Database transaction failed", details: String(dbError) }, { status: 500 })
    }

    // 8. Cache Revalidation
    if (validItems.length > 0) {
      revalidatePath("/")
      revalidatePath("/tv-ranking")
      revalidatePath("/analytics")
    }

    // 9. Prepare Response
    const failureDetails = parsedItems.filter(i => !i.success).map(i => ({
      item_index: i.originalIndex,
      erro: i.error,
      dados_parciais: rawItems[i.originalIndex]
    }))

    return NextResponse.json({
      total_recebido: rawItems.length,
      sucessos: validItems.length,
      // Note: "Updated" items are counted as successes here, consistent with previous logic
      criados: toCreate.length,
      atualizados: toUpdate.length,
      falhas: failureDetails.length,
      detalhes_falhas: failureDetails
    }, { status: 200 })

  } catch (error) {
    console.error(`[Webhook ${PROCESS_ID}] CRITICAL SYSTEM ERROR`, error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

