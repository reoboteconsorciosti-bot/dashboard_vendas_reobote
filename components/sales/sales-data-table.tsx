"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    ChevronLeft,
    ChevronRight,
    Search,
    Calendar as CalendarIcon,
    FileText,
    Loader2,
    Filter
} from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { getSalesList } from "@/app/actions/sales-list-actions"
import { Badge } from "@/components/ui/badge"

// Debounce hook for search
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
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalRecords, setTotalRecords] = useState(0)

    // Filters
    const [searchTerm, setSearchTerm] = useState("")
    const debouncedSearch = useDebounce(searchTerm, 500)
    const [date, setDate] = useState<Date | undefined>(undefined)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await getSalesList({
                page,
                limit: 15,
                search: debouncedSearch,
                startDate: date ? date.toISOString() : undefined,
                endDate: date ? date.toISOString() : undefined // For single day filter now, can expand range later
            })
            setData(res.data)
            setTotalPages(res.totalPages)
            setTotalRecords(res.totalRecords)
        } catch (error) {
            console.error("Failed to fetch sales", error)
        } finally {
            setLoading(false)
        }
    }, [page, debouncedSearch, date])

    useEffect(() => {
        setPage(1) // Reset page on filter change
    }, [debouncedSearch, date])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

    return (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex flex-1 items-center gap-2 w-full md:max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por consultor, admin, grupo..."
                            className="pl-9 bg-background/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Date Filter */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP", { locale: ptBR }) : <span>Filtrar data</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                                locale={ptBR}
                            />
                        </PopoverContent>
                    </Popover>
                    {(searchTerm || date) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSearchTerm(""); setDate(undefined); }}
                            className="text-muted-foreground hover:text-destructive"
                            title="Limpar Filtros"
                        >
                            <Filter className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                <div className="text-sm text-muted-foreground font-medium">
                    {totalRecords} vendas encontradas
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead className="w-[100px]">Data</TableHead>
                            <TableHead>Consultor</TableHead>
                            <TableHead className="hidden md:table-cell">Administradora</TableHead>
                            <TableHead className="hidden md:table-cell">Detalhes (G/C)</TableHead>
                            <TableHead className="text-right">Valor Líquido</TableHead>
                            <TableHead className="text-right hidden sm:table-cell">Valor Bruto</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Carregando...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Nenhuma venda encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((sale) => (
                                <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium">
                                        {format(new Date(sale.dataVenda), "dd/MM/yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                {sale.consultorNome.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="truncate max-w-[150px]" title={sale.consultorNome}>
                                                {sale.consultorNome}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-muted-foreground">
                                        {sale.administradora}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <Badge variant="secondary" className="font-mono text-xs">
                                            {sale.grupo} / {sale.cota}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-success/90">
                                        {formatCurrency(sale.valorLiquido)}
                                    </TableCell>
                                    <TableCell className="text-right hidden sm:table-cell text-muted-foreground text-xs">
                                        {formatCurrency(sale.valorBruto)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages || 1}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    )
}
