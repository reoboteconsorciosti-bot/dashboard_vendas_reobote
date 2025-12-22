import type { SalesData, VendedorRanking, DashboardStats, DashboardFilters } from "./types"

export function filterSalesData(data: SalesData[], filters: DashboardFilters): SalesData[] {
  return data.filter((sale) => {
    if (filters.mes && sale.mes !== filters.mes) return false
    if (filters.ano && sale.ano !== filters.ano) return false
    if (filters.consultor && sale.consultorNome !== filters.consultor) return false
    if (filters.administradora && sale.administradora !== filters.administradora) return false
    if (sale.status !== "confirmado") return false
    return true
  })
}

export function calculateRanking(data: SalesData[]): VendedorRanking[] {
  const consultorMap = new Map<string, VendedorRanking>()

  // Aggregate sales by consultor
  data.forEach((sale) => {
    if (sale.status !== "confirmado") return

    const existing = consultorMap.get(sale.consultorId)
    if (existing) {
      existing.valorLiquido += sale.valorLiquido
      existing.valorBruto += sale.valorBruto
      existing.totalVendas += 1
    } else {
      consultorMap.set(sale.consultorId, {
        consultorNome: sale.consultorNome,
        consultorId: sale.consultorId,
        valorLiquido: sale.valorLiquido,
        valorBruto: sale.valorBruto,
        totalVendas: 1,
        posicao: 0,
        variacaoMes: Math.random() * 30 - 10, // Mock variation -10% to +20%
      })
    }
  })

  // Convert to array and sort by valorLiquido
  const ranking = Array.from(consultorMap.values()).sort((a, b) => b.valorLiquido - a.valorLiquido)

  // Add positions
  ranking.forEach((vendedor, index) => {
    vendedor.posicao = index + 1
  })

  return ranking
}

export function calculateStats(data: SalesData[]): DashboardStats {
  const confirmedSales = data.filter((sale) => sale.status === "confirmado")

  const totalVendasBruto = confirmedSales.reduce((sum, sale) => sum + sale.valorBruto, 0)
  const totalVendasLiquido = confirmedSales.reduce((sum, sale) => sum + sale.valorLiquido, 0)
  const totalTransacoes = confirmedSales.length
  const mediaTicket = totalTransacoes > 0 ? totalVendasLiquido / totalTransacoes : 0

  return {
    totalVendasBruto,
    totalVendasLiquido,
    totalTransacoes,
    mediaTicket,
    crescimentoMes: Math.random() * 20 - 5, // Mock growth -5% to +15%
  }
}

export function getUniqueConsultores(data: SalesData[]): string[] {
  const consultores = new Set<string>()
  data.forEach((sale) => consultores.add(sale.consultorNome))
  return Array.from(consultores).sort()
}

export function getUniqueAdministradoras(data: SalesData[]): string[] {
  const administradoras = new Set<string>()
  data.forEach((sale) => administradoras.add(sale.administradora))
  return Array.from(administradoras).sort()
}
