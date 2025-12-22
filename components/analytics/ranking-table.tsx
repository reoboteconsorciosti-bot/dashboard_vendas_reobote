import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, TrendingUp, TrendingDown } from "lucide-react"
import type { VendedorRanking } from "@/lib/types"

interface RankingTableProps {
  ranking: VendedorRanking[]
}

export function RankingTable({ ranking }: RankingTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getMedalIcon = (posicao: number) => {
    if (posicao <= 3) {
      return <Trophy className="w-5 h-5" style={{ color: `var(--color-${getMedalColor(posicao)})` }} />
    }
    return <span className="text-muted-foreground">{posicao}°</span>
  }

  const getMedalColor = (posicao: number) => {
    switch (posicao) {
      case 1:
        return "gold"
      case 2:
        return "silver"
      case 3:
        return "bronze"
      default:
        return "muted"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Ranking de Vendedores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Pos.</TableHead>
                <TableHead>Consultor</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Valor Bruto</TableHead>
                <TableHead className="text-right">Valor Líquido</TableHead>
                <TableHead className="text-right">Variação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum dado encontrado com os filtros aplicados
                  </TableCell>
                </TableRow>
              ) : (
                ranking.map((vendedor) => (
                  <TableRow key={vendedor.consultorId}>
                    <TableCell className="font-medium">{getMedalIcon(vendedor.posicao)}</TableCell>
                    <TableCell className="font-medium">{vendedor.consultorNome}</TableCell>
                    <TableCell className="text-right">{vendedor.totalVendas}</TableCell>
                    <TableCell className="text-right">{formatCurrency(vendedor.valorBruto)}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatCurrency(vendedor.valorLiquido)}
                    </TableCell>
                    <TableCell className="text-right">
                      {vendedor.variacaoMes !== undefined ? (
                        <div
                          className={`inline-flex items-center gap-1 ${
                            vendedor.variacaoMes >= 0 ? "text-success" : "text-destructive"
                          }`}
                        >
                          {vendedor.variacaoMes >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {Math.abs(vendedor.variacaoMes).toFixed(1)}%
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
