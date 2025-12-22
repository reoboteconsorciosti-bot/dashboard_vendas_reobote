import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, BarChart3, Trophy, User } from "lucide-react"
import { ProfileMenu } from "@/components/profile-menu"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <ProfileMenu />

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-balance">Dashboard de Vendas</h1>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
            Sistema completo de acompanhamento de performance para Reobote Consórcios
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Ranking TV</CardTitle>
              </div>
              <CardDescription>
                Visualização otimizada para TVs corporativas com ranking dos top 3 vendedores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/tv-ranking">
                <Button className="w-full bg-teal-300" size="lg">
                  <Trophy className="w-4 h-4 mr-2" />
                  Abrir Ranking
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-accent transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-accent/10">
                  <BarChart3 className="w-6 h-6 text-[rgba(185,211,211,1)]" />
                </div>
                <CardTitle>Analytics</CardTitle>
              </div>
              <CardDescription>
                Análise detalhada com filtros avançados e visualização de dados completos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/analytics">
                <Button className="w-full bg-transparent" size="lg" variant="outline">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ver Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-secondary transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <User className="w-6 h-6 text-[rgba(47,130,197,1)]" />
                </div>
                <CardTitle>Usuários</CardTitle>
              </div>
              <CardDescription>Configure fotos e nomes de exibição para o ranking de vendas</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/usuarios">
                <Button className="w-full bg-transparent" size="lg" variant="outline">
                  <User className="w-4 h-4 mr-2" />
                  Gerenciar Usuários
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Dados atualizados automaticamente via n8n
          </div>
        </div>
      </div>
    </div>
  )
}
