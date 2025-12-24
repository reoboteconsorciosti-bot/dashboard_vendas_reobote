"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    ArrowUpDown,
    Download,
    DollarSign,
    Target,
    Hash,
    Loader2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { getSalesList } from "@/app/actions/sales-list-actions"
import { getFiltersData } from "@/app/actions/dashboard-actions"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Eye, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)
        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])
    return debouncedValue
}

export function SalesDataTable() {
    const { toast } = useToast()
    const [selectedSale, setSelectedSale] = useState<any | null>(null)
    // Data States
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [aggregations, setAggregations] = useState({ totalLiquido: 0, totalBruto: 0, ticketMedio: 0 })

    // Pagination & Sorting
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalRecords, setTotalRecords] = useState(0)
    const [sortColumn, setSortColumn] = useState("dataVenda")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

    // Filters
    const [searchTerm, setSearchTerm] = useState("")
    const debouncedSearch = useDebounce(searchTerm, 500)
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

    // Dropdown Data
    const [consultants, setConsultants] = useState<string[]>([])
    const [admins, setAdmins] = useState<string[]>([])
    const [selectedConsultant, setSelectedConsultant] = useState<string>("all")
    const [selectedAdmin, setSelectedAdmin] = useState<string>("all")

    // Initialization
    useEffect(() => {
        getFiltersData().then(res => {
            setConsultants(res.consultores)
            setAdmins(res.administradoras)
        })
    }, [])

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await getSalesList({
                page,
                limit: 15,
                search: debouncedSearch,
                startDate: dateRange?.from?.toISOString(),
                endDate: dateRange?.to?.toISOString(),
                consultores: selectedConsultant !== "all" ? [selectedConsultant] : [],
                administradoras: selectedAdmin !== "all" ? [selectedAdmin] : [],
                sortColumn,
                sortDirection
            })

            if (res.success) {
                setData(res.data)
                setTotalPages(res.totalPages)
                setTotalRecords(res.totalRecords)
                setAggregations(res.aggregations)
            } else {
                toast({
                    variant: "destructive",
                    title: "Erro ao carregar vendas",
                    description: res.error || "Tente novamente mais tarde."
                })
            }
        } catch (error) {
            console.error("Failed to fetch sales", error)
            toast({
                variant: "destructive",
                title: "Erro de Conexão",
                description: "Não foi possível conectar ao servidor."
            })
        } finally {
            setLoading(false)
        }
    }, [page, debouncedSearch, dateRange, selectedConsultant, selectedAdmin, sortColumn, sortDirection, toast])

    useEffect(() => {
        setPage(1) // Reset page on filter change
    }, [debouncedSearch, dateRange, selectedConsultant, selectedAdmin])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === "asc" ? "desc" : "asc")
        } else {
            setSortColumn(column)
            setSortDirection("desc") // Default new sort to desc
        }
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

    const exportToCSV = () => {
        // Implement CSV Export Logic locally
        const headers = ["Data", "Consultor", "Administradora", "Grupo", "Cota", "Valor Líquido", "Valor Bruto"]
        const csvContent = [
            headers.join(";"), // Use semicolon for better Excel compatibility in BR
            ...data.map(row => [
                format(new Date(row.dataVenda), "dd/MM/yyyy"),
                `"${row.consultorNome}"`,
                `"${row.administradora}"`,
                row.grupo,
                row.cota,
                row.valorLiquido.toFixed(2).replace('.', ','), // Brazilian Format
                row.valorBruto.toFixed(2).replace('.', ',')   // Brazilian Format
            ].join(";"))
        ].join("\r\n")

        // Add BOM for Excel UTF-8 recognition
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `vendas_export_${format(new Date(), "yyyyMMdd")}.csv`)
        document.body.appendChild(link)
        link.click()
    }

    const handleViewDetails = (sale: any) => {
        setSelectedSale(sale)
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards - "Million Dollar" Feature */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/10">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Volume Filtrado</p>
                            <h3 className="text-2xl font-bold tracking-tight">{formatCurrency(aggregations.totalLiquido)}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-card to-secondary/5 border-secondary/10">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-secondary/10 rounded-full text-secondary-foreground">
                            <Hash className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Vendas Encontradas</p>
                            <h3 className="text-2xl font-bold tracking-tight">{totalRecords}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-card to-green-500/5 border-green-500/10">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-full text-green-600">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Ticket Médio (Filtro)</p>
                            <h3 className="text-2xl font-bold tracking-tight">{formatCurrency(aggregations.ticketMedio)}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Advanced Filters Toolbar */}
            <div className="flex flex-col gap-4 bg-card p-5 rounded-xl border shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4 justify-between">
                    {/* Search & Date */}
                    <div className="flex flex-1 flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar global..."
                                className="pl-9 h-10 bg-background/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <CalendarDateRangePicker
                            date={dateRange}
                            setDate={setDateRange}
                            className="w-full sm:w-auto"
                        />
                    </div>

                    {/* Facets & Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Select value={selectedConsultant} onValueChange={setSelectedConsultant}>
                            <SelectTrigger className="w-full sm:w-[180px] h-10">
                                <SelectValue placeholder="Consultor" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos Consultores</SelectItem>
                                {consultants.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                            <SelectTrigger className="w-full sm:w-[180px] h-10">
                                <SelectValue placeholder="Administradora" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas Admins</SelectItem>
                                {admins.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            className="h-10 hover:bg-primary/5 hover:text-primary transition-colors"
                            onClick={exportToCSV}
                            disabled={data.length === 0}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Pro Data Table */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead className="w-[100px]">Data</TableHead>
                            <TableHead>Consultor</TableHead>
                            <TableHead className="hidden md:table-cell">Admin</TableHead>
                            <TableHead className="hidden md:table-cell">Contrato</TableHead>
                            <TableHead className="text-right">V. Líquido</TableHead>
                            <TableHead className="text-right hidden sm:table-cell">V. Bruto</TableHead>
                            <TableHead className="hidden lg:table-cell">Mês Comp.</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground animate-pulse">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                        <span>Carregando dados...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                                    Nenhum registro encontrado com os filtros atuais.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((sale) => (
                                <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors group">
                                    <TableCell className="font-medium text-muted-foreground text-xs">
                                        {format(new Date(sale.dataVenda), "dd/MM/yy")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center text-[10px] font-bold text-primary ring-1 ring-background">
                                                {sale.consultorNome.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-sm truncate max-w-[120px]" title={sale.consultorNome}>{sale.consultorNome}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs truncate max-w-[100px]" title={sale.administradora}>
                                        {sale.administradora}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <div className="flex flex-col text-[10px]">
                                            <span className="font-mono text-muted-foreground">G:{sale.grupo}</span>
                                            <span className="font-mono text-muted-foreground">C:{sale.cota}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-success text-sm">
                                        {formatCurrency(sale.valorLiquido)}
                                    </TableCell>
                                    <TableCell className="text-right hidden sm:table-cell text-muted-foreground text-xs">
                                        {formatCurrency(sale.valorBruto)}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                        <Badge variant="secondary" className="text-[10px] font-mono">
                                            {sale.mesCompetencia}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => handleViewDetails(sale)}>
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modern Pagination */}
            <div className="flex items-center justify-between px-2 pt-2 border-t border-transparent">
                <div className="text-xs text-muted-foreground">
                    Exibindo {Math.min(15, data.length)} de {totalRecords} registros
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center justify-center text-sm font-medium w-[100px]">
                        Página {page} de {totalPages || 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            {/* Details Sheet */}
            <Sheet open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
                <SheetContent className="w-[400px] sm:w-[540px]">
                    <SheetHeader className="mb-6">
                        <SheetTitle>Detalhes da Venda</SheetTitle>
                        <SheetDescription>
                            ID: <span className="font-mono text-xs">{selectedSale?.id}</span>
                        </SheetDescription>
                    </SheetHeader>

                    {selectedSale && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Data da Venda</p>
                                    <p className="text-sm font-medium flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-primary" />
                                        {format(new Date(selectedSale.dataVenda), "dd 'de' MMMM, yyyy", { locale: require('date-fns/locale/pt-BR') })}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Mês Competência</p>
                                    <Badge variant="outline">{selectedSale.mesCompetencia}</Badge>
                                </div>
                            </div>

                            <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Consultor</p>
                                    <p className="text-lg font-bold text-foreground">{selectedSale.consultorNome}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Administradora</p>
                                        <p className="text-sm">{selectedSale.administradora}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Contrato (G/C)</p>
                                        <p className="text-sm font-mono">{selectedSale.grupo} / {selectedSale.cota}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Card className="bg-primary/5 border-primary/20">
                                    <CardContent className="p-4 space-y-1">
                                        <p className="text-xs font-medium text-primary/80">Valor Líquido</p>
                                        <p className="text-xl font-bold text-success">{formatCurrency(selectedSale.valorLiquido)}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Valor Bruto</p>
                                        <p className="text-xl font-bold">{formatCurrency(selectedSale.valorBruto)}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-2 pt-4 border-t">
                                <p className="text-xs font-medium text-muted-foreground">Metadados do Sistema</p>
                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground font-mono">
                                    <span>Criado em:</span>
                                    <span>{new Date(selectedSale.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
