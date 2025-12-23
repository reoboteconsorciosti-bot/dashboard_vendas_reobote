"use client"

import { useState, useEffect } from "react"
import { ProfileMenu } from "@/components/profile-menu"
import { BackButton } from "@/components/back-button"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp, DollarSign, Target, Sparkles, X, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import type { DashboardFilters, DashboardStats, VendedorRanking } from "@/lib/types"

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<DashboardFilters>({ mes: "0", ano: "0" })
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [ranking, setRanking] = useState<VendedorRanking[]>([])
  const [consultores, setConsultores] = useState<string[]>([])
  const [administradoras, setAdministradoras] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfiles, setUserProfiles] = useState<Record<string, { displayName: string; photoUrl?: string }>>({})
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
          acc: Record<string, { displayName: string; photoUrl?: string }>,
          user: { sheetName: string; displayName: string; photoUrl?: string },
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
                className="w-full md:w-auto group relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Sparkles className="w-4 h-4 mr-2 relative z-10" />
                <span className="relative z-10 font-medium">Filtros Avançados</span>
                {activeAdvancedFilters > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 relative z-10 bg-primary/10 text-primary border-primary/20"
                  >
                    {activeAdvancedFilters}
                  </Badge>
                )}
                <ChevronRight className="w-4 h-4 ml-2 relative z-10 group-hover:translate-x-1 transition-transform" />
              </Button>
            </SheetTrigger>

            <SheetContent side="bottom" className="h-[85vh] overflow-y-auto border-t-2 border-primary/20 bg-background">
              <SheetHeader className="border-b border-border/50 pb-3 mb-5 px-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <SheetTitle className="text-lg font-bold">Filtros Avançados</SheetTitle>
                    <p className="text-xs text-muted-foreground">
                      Configure filtros personalizados para análise detalhada
                    </p>
                  </div>
                  {activeAdvancedFilters > 0 && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 shrink-0">
                      {activeAdvancedFilters} ativos
                    </Badge>
                  )}
                </div>
              </SheetHeader>

              <div className="space-y-6 pb-20 px-1">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground/90 uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    Período
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium flex items-center justify-between">
                        <span>Mês</span>
                        {filters.mes && filters.mes !== "0" && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary">
                            Ativo
                          </Badge>
                        )}
                      </label>
                      <Select value={filters.mes} onValueChange={(value) => setFilters({ ...filters, mes: value })}>
                        <SelectTrigger className="bg-card border-border/50 focus:border-primary/50 transition-all hover:bg-accent/50 h-10">
                          <SelectValue placeholder="Todos os meses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0" className="font-medium">
                            Todos os meses
                          </SelectItem>
                          <SelectItem value="1">Janeiro</SelectItem>
                          <SelectItem value="2">Fevereiro</SelectItem>
                          <SelectItem value="3">Março</SelectItem>
                          <SelectItem value="4">Abril</SelectItem>
                          <SelectItem value="5">Maio</SelectItem>
                          <SelectItem value="6">Junho</SelectItem>
                          <SelectItem value="7">Julho</SelectItem>
                          <SelectItem value="8">Agosto</SelectItem>
                          <SelectItem value="9">Setembro</SelectItem>
                          <SelectItem value="10">Outubro</SelectItem>
                          <SelectItem value="11">Novembro</SelectItem>
                          <SelectItem value="12">Dezembro</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground leading-snug pt-0.5">
                        Filtrar vendas por mês específico
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium flex items-center justify-between">
                        <span>Ano</span>
                        {filters.ano && filters.ano !== "0" && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary">
                            Ativo
                          </Badge>
                        )}
                      </label>
                      <Select value={filters.ano} onValueChange={(value) => setFilters({ ...filters, ano: value })}>
                        <SelectTrigger className="bg-card border-border/50 focus:border-primary/50 transition-all hover:bg-accent/50 h-10">
                          <SelectValue placeholder="Todos os anos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0" className="font-medium">
                            Todos os anos
                          </SelectItem>
                          {[2025, 2024, 2023, 2022, 2021].map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground leading-snug pt-0.5">
                        Filtrar vendas por ano específico
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border/40" />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground/90 uppercase tracking-wider">
                    <Target className="w-3.5 h-3.5 text-primary" />
                    Pessoas
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center justify-between">
                      <span>Consultor</span>
                      {filters.consultor && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary">
                          Ativo
                        </Badge>
                      )}
                    </label>
                    <Select
                      value={filters.consultor || "all"}
                      onValueChange={(value) =>
                        setFilters({ ...filters, consultor: value === "all" ? undefined : value })
                      }
                    >
                      <SelectTrigger className="bg-card border-border/50 focus:border-primary/50 transition-all hover:bg-accent/50 h-10">
                        <SelectValue placeholder="Todos os consultores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="font-medium">
                          Todos os consultores
                        </SelectItem>
                        {consultores.map((c) => (
                          <SelectItem key={c} value={c}>
                            <div className="flex items-center gap-2">
                              {userProfiles[c]?.photoUrl && (
                                <img
                                  src={userProfiles[c].photoUrl || "/placeholder.svg"}
                                  alt={userProfiles[c]?.displayName || c}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                              )}
                              <span>{userProfiles[c]?.displayName || c}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground leading-snug pt-0.5">
                      Ver vendas de um consultor específico
                    </p>
                  </div>
                </div>

                <div className="h-px bg-border/40" />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground/90 uppercase tracking-wider">
                    <DollarSign className="w-3.5 h-3.5 text-primary" />
                    Empresa
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center justify-between">
                      <span>Administradora</span>
                      {filters.administradora && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary">
                          Ativo
                        </Badge>
                      )}
                    </label>
                    <Select
                      value={filters.administradora || "all"}
                      onValueChange={(value) =>
                        setFilters({ ...filters, administradora: value === "all" ? undefined : value })
                      }
                    >
                      <SelectTrigger className="bg-card border-border/50 focus:border-primary/50 transition-all hover:bg-accent/50 h-10">
                        <SelectValue placeholder="Todas as administradoras" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="font-medium">
                          Todas as administradoras
                        </SelectItem>
                        {administradoras.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground leading-snug pt-0.5">
                      Filtrar por administradora específica
                    </p>
                  </div>
                </div>
              </div>

              <div className="fixed bottom-0 left-0 right-0 flex gap-3 p-4 bg-background border-t border-border/50 shadow-lg">
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    className="flex-1 h-11 bg-card hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all"
                    onClick={clearFilters}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpar Tudo
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button
                    className="flex-1 h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Aplicar Filtros
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
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
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {vendedor.foto ? (
                                <img
                                  src={vendedor.foto || "/placeholder.svg"}
                                  alt={vendedor.consultorNome}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-bold text-primary">
                                  {vendedor.consultorNome.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span className="font-medium text-sm">{vendedor.consultorNome}</span>
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
