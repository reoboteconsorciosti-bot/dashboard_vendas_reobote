'use server'

import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export type SalesFilterProps = {
    page?: number
    limit?: number
    search?: string
    startDate?: string
    endDate?: string
    consultores?: string[]
    administradoras?: string[]
    sortColumn?: string
    sortDirection?: 'asc' | 'desc'
}

export async function getSalesList({
    page = 1,
    limit = 20,
    search = "",
    startDate,
    endDate,
    consultores = [],
    administradoras = [],
    sortColumn = "dataVenda",
    sortDirection = "desc"
}: SalesFilterProps) {
    try {
        // Construct Where Clause
        const where: Prisma.SaleWhereInput = {}
        const andConditions: Prisma.SaleWhereInput[] = []

        if (search) {
            andConditions.push({
                OR: [
                    { consultorNome: { contains: search, mode: 'insensitive' } },
                    { administradora: { contains: search, mode: 'insensitive' } },
                    { grupo: { contains: search, mode: 'insensitive' } },
                    { cota: { contains: search, mode: 'insensitive' } }
                ]
            })
        }

        if (startDate && endDate) {
            const start = new Date(startDate)
            const end = new Date(endDate)

            // Validate dates
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                end.setHours(23, 59, 59, 999)
                andConditions.push({
                    dataVenda: {
                        gte: start,
                        lte: end
                    }
                })
            }
        }

        if (consultores && consultores.length > 0) {
            andConditions.push({
                consultorNome: { in: consultores }
            })
        }

        if (administradoras && administradoras.length > 0) {
            andConditions.push({
                administradora: { in: administradoras }
            })
        }

        if (andConditions.length > 0) {
            where.AND = andConditions
        }

        // Dynamic Sort Safety Check
        const validSortColumns = ['dataVenda', 'consultorNome', 'valorLiquido', 'valorBruto', 'administradora']
        const safeSortColumn = validSortColumns.includes(sortColumn) ? sortColumn : 'dataVenda'
        const orderBy: Prisma.SaleOrderByWithRelationInput = {
            [safeSortColumn]: sortDirection
        }

        // Fetch Data, Count & Aggregations in Parallel
        const [sales, total, aggregations] = await Promise.all([
            prisma.sale.findMany({
                where,
                take: limit,
                skip: (page - 1) * limit,
                orderBy,
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
            prisma.sale.count({ where }),
            prisma.sale.aggregate({
                where,
                _sum: {
                    valorLiquido: true,
                    valorBruto: true
                },
                _avg: {
                    valorLiquido: true
                }
            })
        ])

        return {
            success: true,
            data: sales.map(s => ({
                ...s,
                valorBruto: Number(s.valorBruto),
                valorLiquido: Number(s.valorLiquido),
                dataVenda: s.dataVenda.toISOString(), // Ensure serializability
                createdAt: s.createdAt.toISOString()
            })),
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalRecords: total,
            aggregations: {
                totalLiquido: Number(aggregations._sum.valorLiquido || 0),
                totalBruto: Number(aggregations._sum.valorBruto || 0),
                ticketMedio: Number(aggregations._avg.valorLiquido || 0)
            }
        }
    } catch (error) {
        console.error("Error fetching sales list:", error)
        return {
            success: false,
            error: "Falha ao carregar dados de vendas",
            data: [],
            totalPages: 0,
            currentPage: 1,
            totalRecords: 0,
            aggregations: { totalLiquido: 0, totalBruto: 0, ticketMedio: 0 }
        }
    }
}
