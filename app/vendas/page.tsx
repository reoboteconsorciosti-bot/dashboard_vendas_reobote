import { DashboardShell } from "@/components/dashboard-shell"
import { SalesDataTable } from "@/components/sales/sales-data-table"
import { FileText } from "lucide-react"

export const dynamic = "force-dynamic"

export default function VendasPage() {
    return (
        <DashboardShell>
            <div className="container mx-auto p-6 space-y-6 max-w-7xl">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <FileText className="w-6 h-6" />
                        </div>
                        Relatório Detalhado de Vendas
                    </h1>
                    <p className="text-muted-foreground">
                        Visualize, filtre e gerencie todo o histórico de vendas importado.
                    </p>
                </div>

                <SalesDataTable />
            </div>
        </DashboardShell>
    )
}
