export interface SalesData {
  id: string
  consultorNome: string
  consultorId: string
  administradora: string
  valorBruto: number
  valorLiquido: number
  mes: number
  ano: number
  dataVenda: string
  status: "confirmado" | "pendente" | "cancelado"
}

export interface VendedorRanking {
  consultorNome: string
  consultorId: string
  valorLiquido: number
  valorBruto: number
  totalVendas: number
  posicao: number
  variacaoMes?: number
  foto?: string
}

export interface DashboardFilters {
  mes?: string
  ano?: string
  consultor?: string
  administradora?: string
  semestre?: string
}

export interface DashboardStats {
  totalBruto: number
  totalLiquido: number
  totalVendas: number
  totalTransacoes?: number // keeping optional for compatibility if needed
  mediaTicket?: number
  crescimentoMes?: number
}

export interface UserProfile {
  id: string
  sheetName: string // Nome exato como aparece na planilha
  displayName: string // Nome de exibição no ranking
  photoUrl?: string // URL da foto ou base64
  createdAt: string
  updatedAt: string
}
