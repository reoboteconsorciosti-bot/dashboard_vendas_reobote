import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import prisma from "@/lib/prisma"

// --- CONSTANTS & TYPES ---
const N8N_TOKEN = process.env.N8N_WEBHOOK_TOKEN

// --- HELPERS ---

/**
 * Robust currency parser.
 * Handles:
 * - Number: 50000 -> 50000
 * - ISO String: "50000.00" -> 50000
 * - BR String: "R$ 50.000,00" -> 50000
 * - US String: "50,000.00" -> 50000
 */
function parseDecimal(value: any): number {
  try {
    if (value === undefined || value === null) return 0
    if (typeof value === "number") return value

    let str = String(value).trim()

    // Remove symbols like "R$", "$", spaces
    str = str.replace(/[R$\s]/g, "")

    // Case 1: Simple number string "1234.56"
    if (/^-?\d+(\.\d+)?$/.test(str)) {
      return parseFloat(str)
    }

    // Case 2: Mixed format. Detect separator positions.
    const lastDotIndex = str.lastIndexOf(".")
    const lastCommaIndex = str.lastIndexOf(",")

    // If both exist
    if (lastDotIndex !== -1 && lastCommaIndex !== -1) {
      if (lastDotIndex < lastCommaIndex) {
        // BR Format (1.234,56): Remove dots, swap comma to dot
        str = str.replace(/\./g, "").replace(",", ".")
      } else {
        // US Format (1,234.56): Remove commas
        str = str.replace(/,/g, "")
      }
    } else if (lastCommaIndex !== -1) {
      // Assume comma is decimal (common in BR)
      // "1234,56" -> "1234.56"
      // "1,234" -> "1.234" (Small risk if it's meant to be 1234 US style, but BR context implies decimal)
      str = str.replace(",", ".")
    }
    // If only dot exists, assume it's simple number or thousand separator?
    // "1234" -> ok. "1.234" -> 1.234. 
    // If it was 1234 formatted as "1.234", it's parsed as 1.234. 
    // Ideally we assume standard float format for single dot.

    const result = parseFloat(str)
    return isNaN(result) ? 0 : result
  } catch (error) {
    console.warn("ParseDecimal Error:", error)
    return 0
  }
}

/**
 * Robust date parser.
 * Handles:
 * - ISO: "2023-10-25T10:00:00.000Z"
 * - ISO Date: "2023-10-25"
 * - BR Simple: "25/10/2023"
 */
function parseDate(value: any): Date | null {
  try {
    if (!value) return null

    // 1. Try standard Date constructor (handles ISO)
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date
    }

    // 2. Try BR format DD/MM/YYYY
    if (typeof value === "string" && value.includes("/")) {
      const parts = value.split("/")
      if (parts.length === 3) {
        // parts[0] = Day, parts[1] = Month, parts[2] = Year (maybe with time)
        const day = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const yearPart = parts[2].split(" ")[0] // Handle "2025 10:00"
        const year = parseInt(yearPart, 10)

        const brDate = new Date(year, month, day)
        if (!isNaN(brDate.getTime())) return brDate
      }
    }

    return null
  } catch (error) {
    console.warn("ParseDate Error:", error)
    return null
  }
}

// --- MAIN ROUTE ---

export async function POST(request: Request) {
  const PROCESS_ID = Date.now().toString(36).slice(-6) // ID curto seguro para logs
  console.log(`[Webhook ${PROCESS_ID}] --- START PROCESSING ---`)

  try {
    // 1. Validate Authentication
    const authHeader = request.headers.get("authorization")
    const receivedToken = authHeader?.replace("Bearer ", "").trim()

    if (!N8N_TOKEN || receivedToken !== N8N_TOKEN) {
      console.error(`[Webhook ${PROCESS_ID}] AUTH FAILED. Received: '${receivedToken}', Expected: '${N8N_TOKEN}'`)
      return NextResponse.json(
        { error: "Unauthorized", details: "Token inválido ou ausente" },
        { status: 401 }
      )
    }
    console.log(`[Webhook ${PROCESS_ID}] Auth Success`)

    // 2. Read and Log Body (OBSERVABILITY)
    let body: any
    try {
      body = await request.json()
    } catch (e) {
      console.error(`[Webhook ${PROCESS_ID}] JSON PARSE ERROR`, e)
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    console.log(`[Webhook ${PROCESS_ID}] RAW PAYLOAD:`, JSON.stringify(body, null, 2))

    // 3. Normalize Data Structure
    // Handle: { ... } OR [ { ... } ] OR { vendas: [ ... ] }
    let dataToProcess: any = null

    if (Array.isArray(body) && body.length > 0) {
      console.log(`[Webhook ${PROCESS_ID}] Detected Array Payload`)
      dataToProcess = body[0]
    } else if (body.vendas && Array.isArray(body.vendas) && body.vendas.length > 0) {
      console.log(`[Webhook ${PROCESS_ID}] Detected 'vendas' Array Payload`)
      dataToProcess = body.vendas[0]
    } else {
      console.log(`[Webhook ${PROCESS_ID}] Detected Single Object Payload`)
      dataToProcess = body
    }

    if (!dataToProcess) {
      console.error(`[Webhook ${PROCESS_ID}] NO DATA FOUND inside payload`)
      return NextResponse.json({ error: "Payload vazio ou formato desconhecido" }, { status: 400 })
    }

    // 4. Flexible Key Extraction (Case insensitive / Space vs Camel)
    // Helper to find key value ignoring case and symbols
    const findValue = (obj: any, keys: string[]) => {
      const objKeys = Object.keys(obj)
      for (const targetKey of keys) {
        // Direct match
        if (obj[targetKey] !== undefined) return obj[targetKey]

        // Case insensitive match
        const found = objKeys.find(k =>
          k.toLowerCase().replace(/[^a-z0-9]/g, "") === targetKey.toLowerCase().replace(/[^a-z0-9]/g, "")
        )
        if (found) return obj[found]
      }
      return undefined
    }

    const consultor = findValue(dataToProcess, ["consultorNome", "consultor", "nomeConsultor"])
    const administradora = findValue(dataToProcess, ["administradora", "adm"])
    const valLiqRaw = findValue(dataToProcess, ["valorLiquido", "valor_liquido", "valor liquido"])
    const valBrutoRaw = findValue(dataToProcess, ["valorBruto", "valor_bruto", "valor bruto"])
    const dataVendaRaw = findValue(dataToProcess, ["dataVenda", "data_venda", "data venda", "data"])
    const mesCompetenciaRaw = findValue(dataToProcess, ["mesCompetencia", "mes_competencia", "mes_ano", "mesCompetencia"])

    console.log(`[Webhook ${PROCESS_ID}] EXTRACTED VALUES:`, {
      consultor, administradora, valLiqRaw, valBrutoRaw, dataVendaRaw, mesCompetenciaRaw
    })

    // 5. Validation & Sanitization
    if (!consultor || !administradora) {
      const missing = []
      if (!consultor) missing.push("consultor/consultorNome")
      if (!administradora) missing.push("administradora")
      const msg = `Campos obrigatórios faltando: ${missing.join(", ")}`
      console.error(`[Webhook ${PROCESS_ID}] VALIDATION ERROR: ${msg}`)
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const valorLiquido = parseDecimal(valLiqRaw)
    const valorBruto = parseDecimal(valBrutoRaw)

    // Ensure accurate Date Object
    const dataVenda = parseDate(dataVendaRaw) || new Date()

    // Ensure mesCompetencia string
    const mesCompetencia = mesCompetenciaRaw ? String(mesCompetenciaRaw) :
      `${dataVenda.getMonth() + 1}/${dataVenda.getFullYear()}` // Fallback

    console.log(`[Webhook ${PROCESS_ID}] FINAL PROCESSED DATA:`, {
      consultorNome: consultor,
      administradora,
      valorLiquido,
      valorBruto,
      dataVenda,
      mesCompetencia
    })

    // 6. DB Persistence
    const sale = await prisma.sale.create({
      data: {
        consultorNome: String(consultor).trim(),
        administradora: String(administradora).trim(),
        valorLiquido: valorLiquido,
        valorBruto: valorBruto,
        dataVenda: dataVenda,
        mesCompetencia: mesCompetencia
      }
    })

    console.log(`[Webhook ${PROCESS_ID}] DB SUCCESS. ID: ${sale.id}`)

    // 7. Cache Revalidation
    revalidatePath("/")
    revalidatePath("/tv-ranking")
    revalidatePath("/analytics") // Just in case
    console.log(`[Webhook ${PROCESS_ID}] CACHE REVALIDATED`)

    return NextResponse.json({
      success: true,
      id: sale.id,
      message: "Venda processada com sucesso"
    })

  } catch (error) {
    console.error(`[Webhook ${PROCESS_ID}] CRITICAL ERROR:`, error)
    return NextResponse.json({
      success: false,
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: "active", message: "Webhook is listening" })
}
