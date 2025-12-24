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

// Helper to build consistent WHERE clause
function buildWhereClause(filters: FilterParams): Prisma.SaleWhereInput {
    const where: Prisma.SaleWhereInput = {}

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-indexed

    // Date Logic
    const dateFilter: Prisma.DateTimeFilter = {}
    let hasDateFilter = false

    if (filters.ano && filters.ano !== '0') {
        // Year is selected
        const year = Number(filters.ano)

        if (filters.mes && filters.mes !== '0') {
            // Specific Month in Year
            const monthIndex = Number(filters.mes) - 1
            dateFilter.gte = new Date(year, monthIndex, 1)
            dateFilter.lte = new Date(year, monthIndex + 1, 0, 23, 59, 59)
        } else if (filters.semestre) {
            // Semester in Year
            const isFirst = filters.semestre === '1'
            dateFilter.gte = new Date(year, isFirst ? 0 : 6, 1)
            dateFilter.lte = new Date(year, isFirst ? 5 : 11 + 1, 0, 23, 59, 59)
        } else {
            // Full Year
            dateFilter.gte = new Date(year, 0, 1)
            dateFilter.lte = new Date(year, 11, 31, 23, 59, 59)
        }
        hasDateFilter = true
    } else if (filters.mes && filters.mes !== '0') {
        // Month Only (Assume Current Year)
        const monthIndex = Number(filters.mes) - 1
        dateFilter.gte = new Date(currentYear, monthIndex, 1)
        dateFilter.lte = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59)
        hasDateFilter = true
    } else {
        // NO FILTER PROVIDED -> Default to Current Month
        // This ensures Dashboard and KPIs always show relevant data (this month) by default, NOT all time.
        // Unless explicit '0' passed for everything? 
        // If filters is empty object {}, we default to current month.
        // If filters has { ano: '0', mes: '0' }, that implies "All Time".

        const isExplicitAllTime = filters.ano === '0' && filters.mes === '0'

        if (!isExplicitAllTime) {
            dateFilter.gte = new Date(currentYear, currentMonth, 1)
            dateFilter.lte = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
            hasDateFilter = true
        }
    }

    if (hasDateFilter) {
        where.dataVenda = dateFilter
    }

    // Text Filters
    if (filters.consultor && filters.consultor !== 'all') { // 'all' check just in case
        where.consultorNome = { equals: filters.consultor, mode: 'insensitive' }
    }
    if (filters.administradora && filters.administradora !== 'all') {
        where.administradora = { equals: filters.administradora, mode: 'insensitive' }
    }

    return where
}

async function getRankingData(filters: FilterParams = {}) {
    const where = buildWhereClause(filters)

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
    const ranking = salesByConsultant.map((item, index) => {
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

    return sales.map((sale) => ({
        id: sale.id,
        consultorNome: sale.consultorNome,
        administradora: sale.administradora,
        valorLiquido: Number(sale.valorLiquido),
        dataVenda: sale.dataVenda,
        status: 'confirmado' as const
    }))
}

async function getKPIData(filters: FilterParams = {}) {
    const where = buildWhereClause(filters)

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
    return users.map((u) => {
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
        return {
            consultores: consultants.map((c) => c.consultorNome),
            administradoras: adms.map((a) => a.administradora)
        }
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

