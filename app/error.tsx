'use client'

import { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCcw } from "lucide-react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
                Algo deu errado!
            </h2>
            <p className="mb-8 max-w-md text-muted-foreground">
                Não conseguimos carregar a página. Isso pode ser um problema de conexão ou um erro no servidor.
            </p>
            <div className="flex gap-4">
                <Button
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                >
                    Voltar ao Início
                </Button>
                <Button
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                    className="gap-2"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Tentar Novamente
                </Button>
            </div>
        </div>
    )
}
