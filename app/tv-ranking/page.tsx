import { getRanking, getUsers } from "@/app/actions/dashboard-actions"
import { TVRankingClient } from "@/components/tv-ranking-client"
import type { DashboardData } from "@/components/tv-ranking-client"

// This is a Server Component by default
export const dynamic = "force-dynamic"
export default async function TVRankingPage() {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  // Parallel data fetching on SERVER-SIDE (Instant loads thanks to cache)
  const [usersData, rankingMes, rankingAno] = await Promise.all([
    getUsers(),
    getRanking({ mes: currentMonth.toString(), ano: currentYear.toString() }),
    getRanking({ ano: currentYear.toString() })
  ])

  // Process data (Server-Side Calculation)
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
  const totalAnualLiquido = rankingAno.reduce((sum: number, v: any) => sum + v.totalVendido, 0)
  const totalMesLiquido = rankingMes.reduce((sum: number, v: any) => sum + v.totalVendido, 0)
  const totalVendasCount = rankingMes.reduce((sum: number, v: any) => sum + v.volumeVendas, 0)

  // Initial Payload
  const initialData: DashboardData = {
    vendasAnual: totalAnualLiquido, // Now displays Net (Liquido)
    vendasAnualCotas: totalAnualBruto, // Now displays Gross (Bruto)
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
  }

  // Pass data to Client Component for interactivity
  return <TVRankingClient initialData={initialData} />
}
