import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, DollarSign, ShoppingCart, Receipt } from "lucide-react"
import type { DashboardStats } from "@/lib/types"

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const cards = [
    {
      title: "Valor Bruto",
      value: formatCurrency(stats.totalVendasBruto),
      icon: DollarSign,
      color: "primary",
    },
    {
      title: "Valor Líquido",
      value: formatCurrency(stats.totalVendasLiquido),
      icon: Receipt,
      color: "accent",
    },
    {
      title: "Total de Vendas",
      value: stats.totalTransacoes.toString(),
      icon: ShoppingCart,
      color: "info",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(stats.mediaTicket),
      icon: TrendingUp,
      color: "success",
    },
  ]

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                  <p className="text-3xl font-bold tracking-tight">{card.value}</p>
                </div>
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: `var(--color-${card.color})`,
                    opacity: 0.1,
                  }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{
                      color: `var(--color-${card.color})`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
