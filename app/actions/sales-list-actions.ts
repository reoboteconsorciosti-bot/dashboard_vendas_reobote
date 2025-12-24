'use server'

import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export type SalesFilterProps = {
    page?: number
    limit?: number
    search?: string
    startDate?: string
    endDate?: string
}

export async function getSalesList({
    page = 1,
    limit = 20,
    search = "",
    startDate,
    endDate
}: SalesFilterProps) {

    // Construct Where Clause
    const where: Prisma.SaleWhereInput = {}
    const andConditions: Prisma.SaleWhereInput[] = []

    if (search) {
        andConditions.push({
            OR: [
                { consultorNome: { contains: search, mode: 'insensitive' } },
                { administradora: { contains: search, mode: 'insensitive' } },
                { grupo: { contains: search, mode: 'insensitive' } }, // Loose match
                { cota: { contains: search, mode: 'insensitive' } }
            ]
        })
    }

    if (startDate && endDate) {
        // Adjust end date to end of day
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)

        andConditions.push({
            dataVenda: {
                gte: new Date(startDate),
                lte: end
            }
        })
    }

    if (andConditions.length > 0) {
        where.AND = andConditions
    }

    // Fetch Data & Count
    const [sales, total] = await Promise.all([
        prisma.sale.findMany({
            where,
            take: limit,
            skip: (page - 1) * limit,
            orderBy: { dataVenda: 'desc' },
            select: {
                id: true,
                consultorNome: true,
                administradora: true,
                grupo: true,
                cota: true,
                valorBruto: true,
                valorLiquido: true,
                dataVenda: true,
                mesCompetencia: true
            }
        }),
        prisma.sale.count({ where })
    ])

    return {
        data: sales.map(s => ({
            ...s,
            valorBruto: Number(s.valorBruto),
            valorLiquido: Number(s.valorLiquido),
        })),
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalRecords: total
    }
}
