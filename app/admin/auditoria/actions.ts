'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

export async function getAuditStats() {
    try {
        const aggregations = await prisma.sale.aggregate({
            _sum: {
                valorBruto: true,
                valorLiquido: true,
            },
            _count: {
                id: true
            }
        })

        return {
            totalBruto: Number(aggregations._sum.valorBruto || 0),
            totalLiquido: Number(aggregations._sum.valorLiquido || 0),
            totalRegistros: aggregations._count.id
        }
    } catch (error) {
        console.error("Error fetching audit stats:", error)
        return { totalBruto: 0, totalLiquido: 0, totalRegistros: 0 }
    }
}

export async function getOutliers() {
    try {
        // Top 50 sales by liquid value to spot scale errors
        const outliers = await prisma.sale.findMany({
            take: 50,
            orderBy: {
                valorLiquido: 'desc'
            },
            select: {
                id: true,
                consultorNome: true,
                administradora: true,
                grupo: true,
                cota: true,
                valorLiquido: true,
                valorBruto: true,
                dataVenda: true
            }
        })

        // Serializing Decimal to string/number for client
        return outliers.map(s => ({
            ...s,
            valorLiquido: Number(s.valorLiquido),
            valorBruto: Number(s.valorBruto),
            dataVenda: s.dataVenda.toISOString()
        }))
    } catch (error) {
        console.error("Error fetching outliers:", error)
        return []
    }
}

export async function getPotentialDuplicates() {
    try {
        // Check for violations of the UNIQUE logic or dirty data
        // Group by Adm + Grupo + Cota
        const grouped = await prisma.sale.groupBy({
            by: ['administradora', 'grupo', 'cota'],
            _count: {
                id: true
            },
            having: {
                id: {
                    _count: {
                        gt: 1
                    }
                }
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            }
        })

        return grouped.map(g => ({
            administradora: g.administradora,
            grupo: g.grupo,
            cota: g.cota,
            count: g._count.id
        }))
    } catch (error) {
        console.error("Error fetching duplicates:", error)
        return []
    }
}

export async function truncateSales() {
    console.log("[AUDIT] TRUNCATE TABLE REQUESTED")
    try {
        await prisma.sale.deleteMany({}) // DANGER
        revalidatePath("/")
        return { success: true, message: "Banco de dados limpo com sucesso." }
    } catch (error) {
        console.error("Error truncating sales:", error)
        return { success: false, message: "Erro ao limpar banco de dados." }
    }
}
