import type { SalesData } from "./types"

let realSalesData: SalesData[] = []
let lastSyncTime: string | null = null

/**
 * Mock data generator - Replace with n8n webhook endpoint
 * n8n should fetch from Google Sheets and return data in this format
 */
export function generateMockSalesData(): SalesData[] {
  const consultores = [
    { id: "C001", nome: "Carlos Silva" },
    { id: "C002", nome: "Ana Santos" },
    { id: "C003", nome: "Roberto Lima" },
    { id: "C004", nome: "Mariana Costa" },
    { id: "C005", nome: "Felipe Oliveira" },
    { id: "C006", nome: "Juliana Ferreira" },
    { id: "C007", nome: "Pedro Alves" },
    { id: "C008", nome: "Camila Rocha" },
  ]

  const administradoras = [
    "Embracon",
    "Rodobens",
    "Volkswagen Consórcios",
    "Porto Seguro Consórcios",
    "Itaú Consórcios",
    "Santander Consórcios",
  ]

  const salesData: SalesData[] = []
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  // Generate sales for last 6 months
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const mes = currentMonth - monthOffset
    const ano = mes > 0 ? currentYear : currentYear - 1
    const mesAjustado = mes > 0 ? mes : 12 + mes

    consultores.forEach((consultor) => {
      const numVendas = Math.floor(Math.random() * 15) + 5

      for (let i = 0; i < numVendas; i++) {
        const valorBruto = Math.random() * 80000 + 20000
        const descontoPercent = Math.random() * 0.15 + 0.05
        const valorLiquido = valorBruto * (1 - descontoPercent)

        salesData.push({
          id: `${consultor.id}-${ano}-${mesAjustado}-${i}`,
          consultorNome: consultor.nome,
          consultorId: consultor.id,
          administradora: administradoras[Math.floor(Math.random() * administradoras.length)],
          valorBruto,
          valorLiquido,
          mes: mesAjustado,
          ano,
          dataVenda: new Date(ano, mesAjustado - 1, Math.floor(Math.random() * 28) + 1).toISOString(),
          status: Math.random() > 0.1 ? "confirmado" : "pendente",
        })
      }
    })
  }

  return salesData
}

// Simulated cache - In production, use Redis or similar
let cachedData: SalesData[] | null = null
let lastCacheTime = 0
const CACHE_DURATION = 30000 // 30 seconds

/**
 * Retorna dados reais do webhook ou mock data se ainda não sincronizou
 */
export function getCachedSalesData(): SalesData[] {
  if (realSalesData && realSalesData.length > 0) {
    console.log("[v0] Usando dados reais do webhook (", realSalesData.length, "vendas)")
    return realSalesData
  }

  const now = Date.now()
  if (!cachedData || now - lastCacheTime > CACHE_DURATION) {
    console.log("[v0] Gerando mock data (webhook ainda não sincronizado)")
    cachedData = generateMockSalesData()
    lastCacheTime = now
  }

  return cachedData
}

/**
 * Atualiza os dados de vendas quando o webhook recebe novos dados
 */
export function updateSalesData(data: SalesData[]): void {
  realSalesData = data
  lastSyncTime = new Date().toISOString()
  console.log("[v0] Dados atualizados do webhook:", data.length, "vendas em", lastSyncTime)
}

/**
 * Retorna informações sobre a última sincronização
 */
export function getSyncInfo(): { hasRealData: boolean; lastSync: string | null; totalVendas: number } {
  return {
    hasRealData: realSalesData.length > 0,
    lastSync: lastSyncTime,
    totalVendas: realSalesData.length,
  }
}
