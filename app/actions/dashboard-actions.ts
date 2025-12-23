'use server'

import prisma from "@/lib/prisma"
import { unstable_cache } from "next/cache"

// Types
type FilterParams = {
    mes?: string
    ano?: string
    consultor?: string
    administradora?: string
    semestre?: string
}

async function getRankingData(filters: FilterParams = {}) {
    const where: any = {}

    // Fix: The schema uses 'mesCompetencia' as string "fevereiro-2025" or similar? 
    // The webhook saves: mes: mesAnoParseado.mes (number), ano: mesAnoParseado.ano (number).
    // Wait, I need to check the schema I defined.
    // Schema: mesCompetencia String. 
    // Webhook logic: 
    // data: { ... mesCompetencia: venda.mes_ano }
    // But my webhook logic ALSO pushed to 'vendasProcessadas' array with mes/ano (numbers).
    // The Prisma Schema I wrote:
    // model Sale { ... mesCompetencia String ... }
    // It does NOT have 'mes' (int) and 'ano' (int) columns?
    // Let me check the schema I wrote in Step 27.
    // Schema has "mesCompetencia String". It does NOT have separate month/year columns.
    // So I can't filter by 'mes' (int) directly unless I parse 'dataVenda'.
    // better to filter by 'dataVenda' range.

    const dateFilter: any = {}
    if (filters.ano && filters.ano !== '0') {
        const startYear = new Date(`${filters.ano}-01-01`)
        const endYear = new Date(`${filters.ano}-12-31T23:59:59`)
        dateFilter.gte = startYear
        dateFilter.lte = endYear

        if (filters.mes && filters.mes !== '0') {
            const monthIndex = Number(filters.mes) - 1
            const startMonth = new Date(Number(filters.ano), monthIndex, 1)
            const endMonth = new Date(Number(filters.ano), monthIndex + 1, 0, 23, 59, 59)
            dateFilter.gte = startMonth
            dateFilter.lte = endMonth
        } else if (filters.semestre) {
            const isFirst = filters.semestre === '1'
            const startMonth = new Date(Number(filters.ano), isFirst ? 0 : 6, 1)
            const endMonth = new Date(Number(filters.ano), isFirst ? 5 : 11 + 1, 0, 23, 59, 59)
            dateFilter.gte = startMonth
            dateFilter.lte = endMonth
        }
        where.dataVenda = dateFilter
    } else if (filters.mes && filters.mes !== '0') {
        // Month without year is tricky, usually implies current year or all years.
        // Assuming current year for simplicity or all years matching that month?
        // Let's rely on dataVenda.
        // Getting all sales from a specific month across all years is rare. 
        // Let's ignore month filter if year is missing, OR default to current year.
        const currentYear = new Date().getFullYear()
        const monthIndex = Number(filters.mes) - 1
        const startMonth = new Date(currentYear, monthIndex, 1)
        const endMonth = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59)
        where.dataVenda = {
            gte: startMonth,
            lte: endMonth
        }
    }

    if (filters.consultor) where.consultorNome = { equals: filters.consultor, mode: 'insensitive' }
    if (filters.administradora) where.administradora = { equals: filters.administradora, mode: 'insensitive' }

    // Aggregate sales by consultant
    const salesByConsultant = await prisma.sale.groupBy({
        by: ['consultorNome'],
        _sum: {
            valorLiquido: true,
            valorBruto: true,
        },
        _count: {
            id: true
        },
        where,
        orderBy: {
            _sum: {
                valorLiquido: 'desc',
            },
        }
    })

    // Map to ranking (Lightweight payload - No photos)
    const ranking = salesByConsultant.map((item: any, index: number) => {
        return {
            rank: index + 1,
            name: item.consultorNome,
            // photoUrl is handled by the frontend via getUsers() map
            totalVendido: Number(item._sum.valorLiquido || 0),
            totalBruto: Number(item._sum.valorBruto || 0),
            volumeVendas: item._count.id
        }
    })

    return ranking
}

async function getRecentSalesData(limit = 10) {
    const sales = await prisma.sale.findMany({
        take: limit,
        orderBy: {
            createdAt: 'desc'
        }
    })

    return sales.map((sale: any) => ({
        id: sale.id,
        consultorNome: sale.consultorNome,
        administradora: sale.administradora,
        valorLiquido: Number(sale.valorLiquido),
        dataVenda: sale.dataVenda,
        status: 'confirmado' // Assuming all db sales are confirmed for now
    }))
}

async function getKPIData(filters: FilterParams = {}) {
    // Re-use logic for 'where' construction (should probably refactor to shared helper)
    const where: any = {}

    // ... (Duplicate logic for where clause or shared function)
    // For brevity in this turn, I will copy-paste the date logic or use the same filter approach.
    // Actually, let's make a helper if possible or just inline.
    // Inline for safety.

    const dateFilter: any = {}
    if (filters.ano && filters.ano !== '0') {
        const startYear = new Date(`${filters.ano}-01-01`)
        const endYear = new Date(`${filters.ano}-12-31T23:59:59`)
        dateFilter.gte = startYear
        dateFilter.lte = endYear

        if (filters.mes && filters.mes !== '0') {
            const monthIndex = Number(filters.mes) - 1
            const startMonth = new Date(Number(filters.ano), monthIndex, 1)
            const endMonth = new Date(Number(filters.ano), monthIndex + 1, 0, 23, 59, 59)
            dateFilter.gte = startMonth
            dateFilter.lte = endMonth
        } else if (filters.semestre) {
            const isFirst = filters.semestre === '1'
            const startMonth = new Date(Number(filters.ano), isFirst ? 0 : 6, 1)
            const endMonth = new Date(Number(filters.ano), isFirst ? 5 : 11 + 1, 0, 23, 59, 59)
            dateFilter.gte = startMonth
            dateFilter.lte = endMonth
        }
        where.dataVenda = dateFilter
    } else if (filters.mes && filters.mes !== '0') {
        const currentYear = new Date().getFullYear()
        const monthIndex = Number(filters.mes) - 1
        const startMonth = new Date(currentYear, monthIndex, 1)
        const endMonth = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59)
        where.dataVenda = { gte: startMonth, lte: endMonth }
    } else {
        // Default to current month if NO filters? Or all time?
        // getKPIData usually wants specific period. 
        // If empty filters, let's default to CURRENT MONTH like the original code did.
        const now = new Date()
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        where.dataVenda = { gte: startMonth, lte: endMonth }
    }

    if (filters.consultor) where.consultorNome = { equals: filters.consultor, mode: 'insensitive' }
    if (filters.administradora) where.administradora = { equals: filters.administradora, mode: 'insensitive' }

    const aggregations = await prisma.sale.aggregate({
        _sum: {
            valorLiquido: true,
            valorBruto: true,
        },
        _count: {
            id: true
        },
        where
    })

    return {
        totalLiquido: Number(aggregations._sum.valorLiquido || 0),
        totalBruto: Number(aggregations._sum.valorBruto || 0),
        totalVendas: aggregations._count.id,
    }
}

export async function getUsers() {
    // Select ID as well now
    const users = await prisma.user.findMany({
        select: { id: true, name: true, photoUrl: true }
    })

    // Map to format expected by frontend { sheetName: ..., displayName: ... }
    return users.map((u: any) => {
        let optimizedPhotoUrl = null

        if (u.photoUrl) {
            // If it's already a short URL (cloud storage) we could keep it, 
            // but to unify cache strategy, we can route EVERYTHING through our API if we want.
            // However, redirecting external URLs is an extra hop.
            // Strategy: If it starts with 'data:', convert to API route.
            // If it's 'http', keep it or proxy it.
            // The User's request implies we serve via API route to hide complexity and handle base64.
            // Let's route ALL photos via our API for consistency, OR just base64.
            // The prompt said: "Se o usuário tiver foto no banco... deve ser retornado como ... /api/avatar/${user.id}"
            // Implementation:
            optimizedPhotoUrl = `/api/avatar/${u.id}`
        }

        return {
            sheetName: u.name,
            displayName: u.name, // Or proper casing if needed
            photoUrl: optimizedPhotoUrl
        }
    })
}

export async function getFiltersData() {
    // Get unique consultants and adm from Sales table
    const consultants = await prisma.sale.findMany({
        distinct: ['consultorNome'],
        select: { consultorNome: true },
        orderBy: { consultorNome: 'asc' }
    })
    const adms = await prisma.sale.findMany({
        distinct: ['administradora'],
        select: { administradora: true },
        orderBy: { administradora: 'asc' }
    })

    return {
        consultores: consultants.map((c: any) => c.consultorNome),
        administradoras: adms.map((a: any) => a.administradora)
    }
}

// Caching without arguments is fine, but with arguments (filters) 'unstable_cache' needs careful key generation.
// Since these are Server Actions called from Client Components, we might not strictly need 'unstable_cache' if we want real-time.
// However, the user asked for revalidation.
// Let's remove unstable_cache for the filtered queries to avoid key complexity for now, 
// OR use it with a proper key generator. 
// Given the requirements, direct DB calls are fine for small scale. 
// But let's keep it simple and just export the functions directly.

// Cached Exports
export const getRanking = async (filters: FilterParams = {}) => {
    return await unstable_cache(
        async () => getRankingData(filters),
        [`ranking-data-${JSON.stringify(filters)}`], // Validate cache based on filters
        { tags: ['dashboard-data'], revalidate: 3600 }
    )()
}

export const getRecentSales = async (limit = 10) => {
    return await unstable_cache(
        async () => getRecentSalesData(limit),
        [`recent-sales-${limit}`],
        { tags: ['dashboard-data'], revalidate: 3600 }
    )()
}

export const getStats = async (filters: FilterParams = {}) => {
    return await unstable_cache(
        async () => getKPIData(filters),
        [`kpi-data-${JSON.stringify(filters)}`],
        { tags: ['dashboard-data'], revalidate: 3600 }
    )()
}

