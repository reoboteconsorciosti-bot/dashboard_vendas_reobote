"use client"

import { useState, useEffect } from "react"
import { ProfileMenu } from "@/components/profile-menu"
import { BackButton } from "@/components/back-button"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp, DollarSign, Target, Sparkles, X, ChevronRight, Crown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import type { DashboardFilters, DashboardStats, VendedorRanking } from "@/lib/types"

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<DashboardFilters>({ mes: "0", ano: "0" })
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [ranking, setRanking] = useState<VendedorRanking[]>([])
  const [consultores, setConsultores] = useState<string[]>([])
  const [administradoras, setAdministradoras] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfiles, setUserProfiles] = useState<Record<string, { displayName: string; photoUrl?: string | null }>>({})
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const applyQuickFilter = (preset: string) => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    switch (preset) {
      case "current-month":
        setFilters({ mes: currentMonth.toString(), ano: currentYear.toString() })
        break
      case "last-month":
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear
        setFilters({ mes: lastMonth.toString(), ano: lastMonthYear.toString() })
        break
      case "semester":
        const semester = currentMonth <= 6 ? "1" : "2"
        setFilters({ ano: currentYear.toString(), semestre: semester })
        break
      case "year":
        setFilters({ ano: currentYear.toString() })
        break
      case "all":
        setFilters({ mes: "0", ano: "0" })
        break
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const { getStats, getRanking, getUsers, getFiltersData } = await import("@/app/actions/dashboard-actions")

      const [usersData, statsData, rankingData, filtersData] = await Promise.all([
        getUsers(),
        getStats(filters),
        getRanking(filters),
        getFiltersData(),
      ])

      const profilesMap = usersData.reduce(
        (
          acc: Record<string, { displayName: string; photoUrl?: string | null }>,
          user: { sheetName: string; displayName: string; photoUrl?: string | null },
        ) => {
          acc[user.sheetName] = { displayName: user.displayName, photoUrl: user.photoUrl }
          return acc
        },
        {},
      )
      setUserProfiles(profilesMap)

      setStats(statsData)
      setRanking(
        rankingData.map((r: any) => ({
          ...r,
          consultorNome: profilesMap[r.name]?.displayName || r.name,
          foto: profilesMap[r.name]?.photoUrl,
          valorLiquido: r.totalVendido,
          valorBruto: r.totalBruto,
          totalVendas: r.volumeVendas
        })),
      )
      setConsultores(filtersData.consultores)
      setAdministradoras(filtersData.administradoras)
    } catch (error) {
      console.error("[v0] Error fetching analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatCompact = (value: number) => {
    return formatCurrency(value)
  }

  const clearFilters = () => {
    setFilters({ mes: "0", ano: "0" })
    setIsSheetOpen(false)
  }

  const hasActiveFilters =
    (filters.mes && filters.mes !== "0") ||
    (filters.ano && filters.ano !== "0") ||
    filters.consultor ||
    filters.administradora

  const getFilterLabel = () => {
    if (filters.mes !== "0" && filters.ano !== "0") {
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
      return `${monthNames[Number.parseInt(filters.mes || "1") - 1]}/${filters.ano}`
    }
    if (filters.ano !== "0") {
      return `Ano ${filters.ano}`
    }
    return "Todos os períodos"
  }

  const activeAdvancedFilters = [
    filters.mes && filters.mes !== "0",
    filters.ano && filters.ano !== "0",
    filters.consultor,
    filters.administradora,
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-background pb-20">
      <ProfileMenu />
      <BackButton />

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1.5">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                Analytics
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters ? getFilterLabel() : "Visão completa de todas as vendas"}
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2.5 pt-3">
            <Button
              variant={!hasActiveFilters ? "default" : "outline"}
              size="sm"
              onClick={() => applyQuickFilter("all")}
              className="whitespace-nowrap shadow-sm transition-all hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Tudo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyQuickFilter("current-month")}
              className="whitespace-nowrap shadow-sm transition-all hover:scale-105 hover:border-primary/50"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              Mês Atual
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyQuickFilter("last-month")}
              className="whitespace-nowrap shadow-sm transition-all hover:scale-105 hover:border-primary/50"
            >
              Mês Passado
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyQuickFilter("semester")}
              className="whitespace-nowrap shadow-sm transition-all hover:scale-105 hover:border-primary/50"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
              Semestre
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyQuickFilter("year")}
              className="whitespace-nowrap shadow-sm transition-all hover:scale-105 hover:border-primary/50"
            >
              Ano Completo
            </Button>
          </div>

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="w-full md:w-auto h-10 group relative overflow-hidden bg-background/50 hover:bg-background border-primary/20 hover:border-primary/40 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <Sparkles className="w-4 h-4 mr-2 relative z-10 text-primary" />
                <span className="relative z-10 font-medium text-foreground/80 group-hover:text-primary transition-colors">Filtros Avançados</span>
                {activeAdvancedFilters > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-5 ml-2 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                    {activeAdvancedFilters}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 ml-1 relative z-10 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-md border-l border-primary/20 bg-background/95 backdrop-blur-xl p-0 flex flex-col h-full shadow-2xl">
              <SheetHeader className="px-6 py-5 border-b border-border/40 bg-muted/10 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <SheetTitle className="text-xl font-bold flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      Filtros Avançados
                    </SheetTitle>
                    <p className="text-sm text-muted-foreground pl-1">
                      Refine sua análise de vendas
                    </p>
                  </div>
                  {activeAdvancedFilters > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <X className="w-3 h-3 mr-1" /> Limpar ({activeAdvancedFilters})
                    </Button>
                  )}
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Period Section */}
                <div className="space-y-3 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold tracking-tight">Período</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground ml-1">Mês</label>
                      <Select value={filters.mes} onValueChange={(value) => setFilters({ ...filters, mes: value })}>
                        <SelectTrigger className="bg-background/50 border-input/60 hover:border-primary/50 transition-colors h-9">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0" className="text-muted-foreground">Todos os meses</SelectItem>
                          <SelectSeparator />
                          {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (
                            <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground ml-1">Ano</label>
                      <Select value={filters.ano} onValueChange={(value) => setFilters({ ...filters, ano: value })}>
                        <SelectTrigger className="bg-background/50 border-input/60 hover:border-primary/50 transition-colors h-9">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0" className="text-muted-foreground">Todos os anos</SelectItem>
                          <SelectSeparator />
                          {[2025, 2024, 2023, 2022].map((year) => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* People Section */}
                <div className="space-y-3 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-500">
                      <Target className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold tracking-tight">Consultor</span>
                  </div>

                  <Select
                    value={filters.consultor || "all"}
                    onValueChange={(value) =>
                      setFilters({ ...filters, consultor: value === "all" ? undefined : value })
                    }
                  >
                    <SelectTrigger className="bg-background/50 border-input/60 hover:border-primary/50 transition-colors h-10 w-full">
                      <SelectValue placeholder="Todos os consultores" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="all" className="text-muted-foreground font-medium">
                        Todos os consultores
                      </SelectItem>
                      <SelectSeparator />
                      {consultores.map((c) => (
                        <SelectItem key={c} value={c}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                              {userProfiles[c]?.photoUrl ? (
                                <img
                                  src={userProfiles[c].photoUrl}
                                  alt={c}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full w-full text-[9px] font-bold bg-primary/10 text-primary">
                                  {c.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <span className="truncate">{userProfiles[c]?.displayName || c}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Company Section */}
                <div className="space-y-3 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold tracking-tight">Administradora</span>
                  </div>

                  <Select
                    value={filters.administradora || "all"}
                    onValueChange={(value) =>
                      setFilters({ ...filters, administradora: value === "all" ? undefined : value })
                    }
                  >
                    <SelectTrigger className="bg-background/50 border-input/60 hover:border-primary/50 transition-colors h-10">
                      <SelectValue placeholder="Todas as administradoras" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-muted-foreground font-medium">
                        Todas as administradoras
                      </SelectItem>
                      <SelectSeparator />
                      {administradoras.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-border/40 bg-muted/5 mt-auto flex flex-col sm:flex-row gap-3">
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    className="flex-1 h-11 border-border/60 hover:bg-accent hover:text-accent-foreground font-medium transition-all"
                  >
                    Fechar
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button
                    onClick={() => setIsSheetOpen(false)}
                    className="flex-[2] h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] transition-all"
                  >
                    Ver Resultados
                    <ChevronRight className="w-4 h-4 ml-2 opacity-80" />
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>

          {/* Bottom Actions Fixed Mobile - If needed, but SheetClose covers it. Deleted separate fixed bottom bar inside Sheet if it was there before. */}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <Card className="p-4 bg-gradient-to-br from-card to-primary/5 border-primary/10 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <p className="text-xs font-medium">Total Bruto</p>
                    </div>
                    <p className="text-xl md:text-2xl font-bold tracking-tight">{formatCompact(stats.totalBruto)}</p>
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-card to-success/5 border-success/10 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      <p className="text-xs font-medium">Total Líquido</p>
                    </div>
                    <p className="text-xl md:text-2xl font-bold tracking-tight text-success">
                      {formatCompact(stats.totalLiquido)}
                    </p>
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-card to-accent/5 border-accent/10 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Target className="w-4 h-4" />
                      <p className="text-xs font-medium">Total Vendas</p>
                    </div>
                    <p className="text-xl md:text-2xl font-bold tracking-tight">{stats.totalVendas}</p>
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-card to-gold/5 border-gold/10 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <p className="text-xs font-medium">Ticket Médio</p>
                    </div>
                    <p className="text-xl md:text-2xl font-bold tracking-tight">
                      {formatCompact(stats.totalLiquido / stats.totalVendas)}
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {ranking.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-end max-w-4xl mx-auto pt-4">
                {/* 2nd Place */}
                {ranking[1] && (
                  <div className="order-2 md:order-1 flex flex-col items-center">
                    <div className="relative mb-3 group">
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-slate-300 shadow-xl overflow-hidden bg-background relative z-10 group-hover:scale-105 transition-transform">
                        {ranking[1].foto ? (
                          <img src={ranking[1].foto} alt={ranking[1].consultorNome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-bold text-2xl">
                            {ranking[1].consultorNome.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-800 text-xs font-bold px-3 py-1 rounded-full shadow-md z-20 border-2 border-background">
                        2º Lugar
                      </div>
                    </div>
                    <div className="text-center mt-2">
                      <p className="font-bold text-sm md:text-base line-clamp-1">{ranking[1].consultorNome}</p>
                      <p className="text-slate-500 font-bold text-sm">{formatCompact(ranking[1].valorLiquido)}</p>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {ranking[0] && (
                  <div className="order-1 md:order-2 flex flex-col items-center -mt-8 md:-mt-12">
                    <div className="relative mb-4 group">
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-0 animate-bounce">
                        <Crown className="w-10 h-10 text-yellow-400 drop-shadow-lg fill-yellow-400" />
                      </div>
                      <div className="w-32 h-32 md:w-36 md:h-36 rounded-full border-[5px] border-yellow-400 shadow-2xl shadow-yellow-400/20 overflow-hidden bg-background relative z-10 group-hover:scale-110 transition-transform duration-300">
                        {ranking[0].foto ? (
                          <img src={ranking[0].foto} alt={ranking[0].consultorNome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-yellow-50 text-yellow-600 font-bold text-4xl">
                            {ranking[0].consultorNome.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg z-20 border-[3px] border-background flex items-center gap-1">
                        <Crown className="w-3 h-3 fill-white/80" /> 1º Lugar
                      </div>
                    </div>
                    <div className="text-center mt-3 p-3 bg-gradient-to-b from-yellow-500/10 to-transparent rounded-2xl w-full">
                      <p className="font-bold text-lg md:text-xl line-clamp-1 text-foreground">{ranking[0].consultorNome}</p>
                      <p className="text-yellow-600 dark:text-yellow-500 font-bold text-base md:text-lg">{formatCompact(ranking[0].valorLiquido)}</p>
                      <Badge variant="secondary" className="mt-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 border-yellow-200/50">
                        {ranking[0].totalVendas} Vendas
                      </Badge>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {ranking[2] && (
                  <div className="order-3 flex flex-col items-center">
                    <div className="relative mb-3 group">
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-amber-600 shadow-xl overflow-hidden bg-background relative z-10 group-hover:scale-105 transition-transform">
                        {ranking[2].foto ? (
                          <img src={ranking[2].foto} alt={ranking[2].consultorNome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-amber-50 text-amber-700 font-bold text-2xl">
                            {ranking[2].consultorNome.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-20 border-2 border-background">
                        3º Lugar
                      </div>
                    </div>
                    <div className="text-center mt-2">
                      <p className="font-bold text-sm md:text-base line-clamp-1">{ranking[2].consultorNome}</p>
                      <p className="text-amber-700 dark:text-amber-600 font-bold text-sm">{formatCompact(ranking[2].valorLiquido)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Card className="overflow-hidden shadow-md border-border/50">
              <div className="p-4 border-b bg-muted/50">
                <h2 className="font-semibold">Ranking de Vendedores</h2>
                <p className="text-xs text-muted-foreground mt-1">{ranking.length} vendedores encontrados</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30 text-xs">
                    <tr>
                      <th className="text-left p-3 font-medium">#</th>
                      <th className="text-left p-3 font-medium">Vendedor</th>
                      <th className="text-right p-3 font-medium hidden md:table-cell">Bruto</th>
                      <th className="text-right p-3 font-medium">Líquido</th>
                      <th className="text-right p-3 font-medium hidden sm:table-cell">Vendas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((vendedor, index) => (
                      <tr
                        key={vendedor.consultorNome}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold">
                            {index + 1}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-16 h-16 -my-3 rounded-full bg-gradient-to-br from-primary/20 via-background to-primary/5 flex items-center justify-center overflow-hidden flex-shrink-0 border-4 border-background shadow-xl hover:scale-110 transition-transform duration-300 relative z-10">
                                {vendedor.foto ? (
                                  <img
                                    src={vendedor.foto || "/placeholder.svg"}
                                    alt={vendedor.consultorNome}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-lg font-bold text-primary">
                                    {vendedor.consultorNome.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              {index < 3 && (
                                <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-background shadow-sm z-20 ${index === 0 ? "bg-yellow-400 text-yellow-900" :
                                  index === 1 ? "bg-slate-300 text-slate-800" :
                                    "bg-amber-600 text-amber-100"
                                  }`}>
                                  {index + 1}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-base text-foreground/90">{vendedor.consultorNome}</span>
                              {index === 0 && <span className="text-[10px] uppercase font-bold text-yellow-500 tracking-wider">Líder do Mês 👑</span>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right text-sm hidden md:table-cell text-muted-foreground">
                          {formatCompact(vendedor.valorBruto)}
                        </td>
                        <td className="p-3 text-right text-sm font-semibold">{formatCompact(vendedor.valorLiquido)}</td>
                        <td className="p-3 text-right text-sm hidden sm:table-cell">
                          <Badge variant="secondary">{vendedor.totalVendas}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
