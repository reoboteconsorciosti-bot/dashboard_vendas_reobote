"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Crown, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { VendedorRanking } from "@/lib/types"

export interface DashboardData {
    vendasAnual: number
    vendasAnualCotas: number
    vendasMes: number
    mesAtual: string
    churrascometro: number
    ultimaVenda: {
        consultor: string
        data: string
        valor: number
        foto?: string
    }
    prospeccao: number
    quentes: number
    ranking: VendedorRanking[]
}

interface TVRankingClientProps {
    initialData: DashboardData
}

export function TVRankingClient({ initialData }: TVRankingClientProps) {
    const [data, setData] = useState<DashboardData>(initialData)
    const [currentTime, setCurrentTime] = useState(new Date())
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    const fetchData = async () => {
        try {
            // Re-fetch logic for client-side updates (polling)
            // Note: We need to replicate the logic from the server component here OR 
            // create a specific API route/server action that returns exactly DashboardData.
            // For now, I will assume we can reuse the server actions via dynamic import or direct import if they are 'use server'.
            // Since 'dashboard-actions' are 'use server', we can import them.

            const { getRanking, getUsers } = await import("@/app/actions/dashboard-actions")

            const currentDate = new Date()
            const currentMonth = currentDate.getMonth() + 1
            const currentYear = currentDate.getFullYear()

            const [usersData, rankingMes, rankingAno] = await Promise.all([
                getUsers(),
                getRanking({ mes: currentMonth.toString(), ano: currentYear.toString() }),
                getRanking({ ano: currentYear.toString() })
            ])

            const profilesMap = usersData.reduce(
                (
                    acc: Record<string, { displayName: string; photoUrl?: string }>,
                    user: { sheetName: string; displayName: string; photoUrl?: string },
                ) => {
                    acc[user.sheetName] = { displayName: user.displayName, photoUrl: user.photoUrl }
                    return acc
                },
                {},
            )

            const totalAnualBruto = rankingAno.reduce((sum: number, v: any) => sum + v.totalBruto, 0)
            const totalMesLiquido = rankingMes.reduce((sum: number, v: any) => sum + v.totalVendido, 0)
            const totalVendasCount = rankingMes.reduce((sum: number, v: any) => sum + v.volumeVendas, 0)

            setData({
                vendasAnual: totalAnualBruto,
                vendasAnualCotas: 0,
                vendasMes: totalMesLiquido,
                mesAtual: currentDate.toLocaleDateString("pt-BR", { month: "long" }),
                churrascometro: totalAnualBruto > 0 ? Math.min((totalMesLiquido / 1500000) * 100, 100) : 0,
                ultimaVenda: {
                    consultor: rankingMes[0]?.name
                        ? profilesMap[rankingMes[0]?.name]?.displayName || rankingMes[0]?.name
                        : "Nenhuma venda",
                    data: rankingMes[0] ? new Date().toLocaleDateString("pt-BR") : "-",
                    valor: rankingMes[0]?.totalVendido || 0,
                    foto: rankingMes[0] ? profilesMap[rankingMes[0]?.name]?.photoUrl : undefined,
                },
                prospeccao: totalVendasCount * 10,
                quentes: Math.floor(totalVendasCount * 0.15),
                ranking: rankingMes.slice(0, 3).map((r: any) => ({
                    ...r,
                    consultorNome: profilesMap[r.name]?.displayName || r.name,
                    foto: profilesMap[r.name]?.photoUrl,
                    valorLiquido: r.totalVendido,
                    valorBruto: r.totalBruto,
                    totalVendas: r.volumeVendas
                })),
            })
            setError(null)
        } catch (error) {
            console.error("Error fetching data:", error)
            // Silent error on polling, or minimal UI indication?
            // Keeping original behavior implies we might want to know, but let's just log it to avoid disrupting the screen.
        }
    }

    useEffect(() => {
        // Start polling after mount
        const interval = setInterval(fetchData, 30000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const formatCurrency = (value: number) => {
        const formatted = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
        return formatted.replace(/\s/g, " ")
    }

    const formatCompact = (value: number) => {
        return formatCurrency(value)
    }

    if (error) {
        // Error UI
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-8">
                <div className="text-center space-y-6 max-w-lg bg-card p-10 rounded-xl border border-destructive/20 shadow-lg">
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
                        <LogOut className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Algo deu errado</h2>
                    <Button onClick={() => window.location.reload()} variant="outline">Recarregar</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-cyan-ultra-light relative">
            <div className="absolute top-6 left-6 z-10">
                <img
                    src="/images/logo-reobote-pc-tablet-20-281-29.jpg"
                    alt="Reobote Consórcios"
                    className="h-12 w-auto object-contain opacity-90"
                />
            </div>

            <div className="fixed bottom-6 left-6 z-50">
                <Button
                    onClick={() => router.push("/")}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 hover:border-destructive/40 text-destructive transition-all duration-200 opacity-30 hover:opacity-100"
                >
                    <LogOut className="w-4 h-4" />
                </Button>
            </div>

            <div className="relative max-w-[1920px] mx-auto px-16 py-12">
                <div className="grid grid-cols-2 gap-8 mb-10 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
                    <Card className="p-10 bg-card/60 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-muted-foreground tracking-[0.15em] uppercase">Vendas Anual</p>
                            <p className="text-display font-bold tracking-tight">{formatCompact(data.vendasAnual)}</p>
                        </div>
                    </Card>
                    <Card className="p-10 bg-card/60 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-muted-foreground tracking-[0.15em] uppercase">
                                Vendas Anual Cotas
                            </p>
                            <p className="text-display font-bold tracking-tight">{formatCompact(data.vendasAnualCotas)}</p>
                        </div>
                    </Card>
                </div>

                <Card
                    className="p-16 mb-10 bg-gradient-to-br from-card/70 to-cyan-ultra-light/30 backdrop-blur-sm border border-border/50 shadow-md animate-fade-in-up"
                    style={{ animationDelay: "0.1s" }}
                >
                    <div className="text-center space-y-5">
                        <p className="text-xl font-medium text-muted-foreground tracking-wide">
                            Vendas do Mês: <span className="capitalize font-semibold">{data.mesAtual}</span>
                        </p>
                        <p className="text-display font-bold tracking-tighter bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {formatCompact(data.vendasMes)}
                        </p>
                    </div>
                </Card>

                <div className="mb-10 space-y-5 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                    <div className="flex items-baseline justify-between px-2">
                        <h2 className="text-2xl font-semibold tracking-tight">Churrascômetro</h2>
                        <p className="text-heading font-bold text-primary">{data.churrascometro.toFixed(1)}%</p>
                    </div>
                    <div className="relative h-10 bg-muted/40 rounded-lg overflow-hidden border border-border/30 shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-warning via-gold to-warning transition-all duration-1000 ease-out relative"
                            style={{ width: `${data.churrascometro}%` }}
                        >
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-progress"
                                style={{ backgroundSize: "200% 100%" }}
                            />
                        </div>
                    </div>
                </div>

                <Card
                    className="p-10 mb-10 bg-card/60 backdrop-blur-sm border border-border/50 shadow-sm animate-fade-in-up"
                    style={{ animationDelay: "0.2s" }}
                >
                    <div className="space-y-8">
                        <h2 className="text-xl font-semibold tracking-tight">Última Venda</h2>
                        <div className="flex items-center gap-10">
                            <div className="relative">
                                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 via-cyan-light/30 to-primary/10 border-[3px] border-primary/30 flex items-center justify-center overflow-hidden shadow-lg">
                                    {data.ultimaVenda.foto ? (
                                        <img
                                            src={data.ultimaVenda.foto || "/placeholder.svg"}
                                            alt={data.ultimaVenda.consultor}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-4xl font-bold text-primary">
                                            {data.ultimaVenda.consultor.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                <p className="text-heading font-bold tracking-tight">{data.ultimaVenda.consultor}</p>
                                <p className="text-base text-muted-foreground">Data de Fechamento: {data.ultimaVenda.data}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-display font-bold tracking-tight text-success">
                                    {formatCompact(data.ultimaVenda.valor)}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-2 gap-8 mb-12 animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
                    <Card className="p-10 bg-card/60 backdrop-blur-sm border border-border/50 shadow-sm">
                        <div className="text-center space-y-4">
                            <p className="text-sm font-semibold text-muted-foreground tracking-[0.15em] uppercase">Prospecção</p>
                            <p className="text-display font-bold tracking-tight">{data.prospeccao.toLocaleString("pt-BR")}</p>
                        </div>
                    </Card>
                    <Card className="p-10 bg-card/60 backdrop-blur-sm border border-border/50 shadow-sm">
                        <div className="text-center space-y-4">
                            <p className="text-sm font-semibold text-muted-foreground tracking-[0.15em] uppercase">Quentes</p>
                            <p className="text-display font-bold tracking-tight">{data.quentes.toLocaleString("pt-BR")}</p>
                        </div>
                    </Card>
                </div>

                <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                    <h2 className="text-2xl font-semibold tracking-tight px-2">Ranking de Empresas Parceiras</h2>

                    <div className="grid grid-cols-3 gap-8 items-end pt-6">
                        {data.ranking[1] && (
                            <div className="pb-10">
                                <Card className="p-8 bg-card/60 backdrop-blur-sm border-2 border-silver/30 hover:border-silver/50 transition-all duration-300 shadow-md hover:shadow-lg">
                                    <div className="flex flex-col items-center space-y-6">
                                        <div className="relative">
                                            <div className="w-36 h-36 rounded-full bg-gradient-to-br from-silver/30 via-silver/15 to-transparent border-[3px] border-silver/40 flex items-center justify-center overflow-hidden shadow-lg">
                                                {data.ranking[1].foto ? (
                                                    <img
                                                        src={data.ranking[1].foto || "/placeholder.svg"}
                                                        alt={data.ranking[1].consultorNome}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-6xl font-bold text-silver/90">
                                                        {data.ranking[1].consultorNome.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="absolute -top-2 -right-2 w-11 h-11 rounded-full bg-silver flex items-center justify-center font-bold text-background text-lg shadow-lg">
                                                2
                                            </div>
                                        </div>
                                        <div className="text-center space-y-2 w-full">
                                            <p className="text-2xl font-bold tracking-tight text-balance leading-tight">
                                                {data.ranking[1].consultorNome}
                                            </p>
                                            <p className="text-heading font-bold text-silver">
                                                {formatCompact(data.ranking[1].valorLiquido)}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {data.ranking[0] && (
                            <div>
                                <Card className="p-10 bg-gradient-to-br from-card/80 to-gold/5 backdrop-blur-sm border-2 border-gold/40 hover:border-gold/60 transition-all duration-300 shadow-xl animate-pulse-glow">
                                    <div className="flex flex-col items-center space-y-6">
                                        <div className="relative">
                                            <div className="w-44 h-44 rounded-full bg-gradient-to-br from-gold/40 via-gold/20 to-transparent border-[3px] border-gold/50 flex items-center justify-center overflow-hidden shadow-2xl">
                                                {data.ranking[0].foto ? (
                                                    <img
                                                        src={data.ranking[0].foto || "/placeholder.svg"}
                                                        alt={data.ranking[0].consultorNome}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-7xl font-bold text-gold">
                                                        {data.ranking[0].consultorNome.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-pulse-subtle">
                                                <Crown className="w-14 h-14 text-gold fill-gold drop-shadow-2xl" />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-14 h-14 rounded-full bg-gold flex items-center justify-center font-bold text-background text-2xl shadow-lg">
                                                1
                                            </div>
                                        </div>
                                        <div className="text-center space-y-3 w-full">
                                            <p className="text-heading font-bold tracking-tight text-balance leading-tight">
                                                {data.ranking[0].consultorNome}
                                            </p>
                                            <p className="text-display font-bold text-gold">{formatCompact(data.ranking[0].valorLiquido)}</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {data.ranking[2] && (
                            <div className="pb-10">
                                <Card className="p-8 bg-card/60 backdrop-blur-sm border-2 border-bronze/30 hover:border-bronze/50 transition-all duration-300 shadow-md hover:shadow-lg">
                                    <div className="flex flex-col items-center space-y-6">
                                        <div className="relative">
                                            <div className="w-36 h-36 rounded-full bg-gradient-to-br from-bronze/30 via-bronze/15 to-transparent border-[3px] border-bronze/40 flex items-center justify-center overflow-hidden shadow-lg">
                                                {data.ranking[2].foto ? (
                                                    <img
                                                        src={data.ranking[2].foto || "/placeholder.svg"}
                                                        alt={data.ranking[2].consultorNome}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-6xl font-bold text-bronze/90">
                                                        {data.ranking[2].consultorNome.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="absolute -top-2 -right-2 w-11 h-11 rounded-full bg-bronze flex items-center justify-center font-bold text-background text-lg shadow-lg">
                                                3
                                            </div>
                                        </div>
                                        <div className="text-center space-y-2 w-full">
                                            <p className="text-2xl font-bold tracking-tight text-balance leading-tight">
                                                {data.ranking[2].consultorNome}
                                            </p>
                                            <p className="text-heading font-bold text-bronze">
                                                {formatCompact(data.ranking[2].valorLiquido)}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>

                <div
                    className="flex items-center justify-between mt-16 pt-8 border-t border-border/30 text-muted-foreground animate-fade-in-up"
                    style={{ animationDelay: "0.35s" }}
                >
                    <p className="text-xs tracking-wide">Sincronização: n8n + Google Sheets</p>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse-subtle shadow-sm" />
                        <p className="text-sm font-mono tracking-tight">{currentTime.toLocaleTimeString("pt-BR")}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
