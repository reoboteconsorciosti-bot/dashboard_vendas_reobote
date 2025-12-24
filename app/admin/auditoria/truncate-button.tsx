'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"
import { truncateSales } from "./actions"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function TruncateButton() {
    const [loading, setLoading] = useState(false)

    const handleTruncate = async () => {
        setLoading(true)
        try {
            const res = await truncateSales()
            if (res.success) {
                alert(res.message)
                window.location.reload()
            } else {
                alert("Erro: " + res.message)
            }
        } catch (e) {
            alert("Erro inesperado.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    LIMPEZA DE EMERGÊNCIA (TRUNCATE)
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-destructive/50 bg-destructive/5">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        PERIGO: AÇÃO IRREVERSÍVEL
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-foreground/80">
                        Você está prestes a apagar <strong>TODAS</strong> as vendas do banco de dados.<br /><br />
                        Isso é usado apenas quando a importação de dados foi corrompida e precisa ser refeita do zero.<br /><br />
                        Tem certeza absoluta?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleTruncate} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        {loading ? "Apagando..." : "SIM, APAGAR TUDO"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
