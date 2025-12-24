import { getAuditStats, getOutliers, getPotentialDuplicates } from "./actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TruncateButton } from "./truncate-button"
import { AlertTriangle, CheckCircle2, Database, Search } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"

export const dynamic = 'force-dynamic'

export default async function AuditoriaPage() {
    const [stats, outliers, duplicates] = await Promise.all([
        getAuditStats(),
        getOutliers(),
        getPotentialDuplicates()
    ])

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

    return (
        <DashboardShell>
            <div className="container mx-auto p-6 space-y-8 max-w-7xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-destructive flex items-center gap-2">
                            <Database className="w-8 h-8" />
                            Auditoria Forense de Dados
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Diagnóstico profundo de integridade do banco de dados
                        </p>
                    </div>
                    <TruncateButton />
                </div>

                {/* 1. SUMÁRIO DE INTEGRIDADE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Líquido (Banco)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">{formatCurrency(stats.totalLiquido)}</div>
                            <p className="text-xs text-muted-foreground">Soma direta SQL</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bruto (Banco)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.totalBruto)}</div>
                            <p className="text-xs text-muted-foreground">Soma direta SQL</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Registros</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalRegistros}</div>
                            <p className="text-xs text-muted-foreground">Linhas na tabela 'Sale'</p>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. DETECTOR DE DUPLICIDADE */}
                <Card className={duplicates.length > 0 ? "border-destructive/50" : "border-success/50"}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    {duplicates.length > 0 ? <AlertTriangle className="text-destructive w-5 h-5" /> : <CheckCircle2 className="text-success w-5 h-5" />}
                                    Integridade de Unicidade (Adm + Grupo + Cota)
                                </CardTitle>
                                <CardDescription>
                                    Verifica se existem registros duplicados violando a regra de negócio.
                                </CardDescription>
                            </div>
                            {duplicates.length > 0 && <Badge variant="destructive">{duplicates.length} Duplicidades Encontradas</Badge>}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {duplicates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-success bg-success/5 rounded-lg border border-success/20">
                                <CheckCircle2 className="w-12 h-12 mb-2" />
                                <p className="font-semibold">Nenhuma duplicidade detectada!</p>
                                <p className="text-sm opacity-80">A constraint unique está funcionando corretamente.</p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted text-muted-foreground">
                                        <tr>
                                            <th className="p-3 text-left">Administradora</th>
                                            <th className="p-3 text-left">Grupo</th>
                                            <th className="p-3 text-left">Cota</th>
                                            <th className="p-3 text-right">Ocorrências</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {duplicates.map((d, i) => (
                                            <tr key={i} className="border-t hover:bg-muted/50">
                                                <td className="p-3 font-mono text-destructive">"{d.administradora}"</td>
                                                <td className="p-3 font-mono text-destructive">"{d.grupo}"</td>
                                                <td className="p-3 font-mono text-destructive">"{d.cota}"</td>
                                                <td className="p-3 text-right font-bold">{d.count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. TABELA DE OUTLIERS */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Search className="w-5 h-5 text-blue-500" />
                            <div>
                                <CardTitle>Top 50 Maiores Valores (Outliers Check)</CardTitle>
                                <CardDescription>Use esta lista para identificar erros de escala (ex: R$ 50 Mi ao invés de R$ 50 Mil).</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="p-3 text-left">Consultor</th>
                                        <th className="p-3 text-left hidden md:table-cell">Adm / Grupo / Cota</th>
                                        <th className="p-3 text-right text-blue-600">Valor Líquido (RAW)</th>
                                        <th className="p-3 text-right">Valor Formatado</th>
                                        <th className="p-3 text-right hidden sm:table-cell">Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {outliers.map((s) => (
                                        <tr key={s.id} className="border-t hover:bg-muted/50">
                                            <td className="p-3 font-medium">{s.consultorNome}</td>
                                            <td className="p-3 hidden md:table-cell text-muted-foreground">
                                                {s.administradora} <br />
                                                <span className="text-xs">{s.grupo} / {s.cota}</span>
                                            </td>
                                            <td className="p-3 text-right font-mono bg-blue-50/50 text-blue-700">
                                                {s.valorLiquido}
                                            </td>
                                            <td className="p-3 text-right font-semibold">
                                                {formatCurrency(s.valorLiquido)}
                                            </td>
                                            <td className="p-3 text-right hidden sm:table-cell text-muted-foreground">
                                                {new Date(s.dataVenda).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    )
}
