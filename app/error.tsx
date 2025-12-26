'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center text-foreground">
            <h2 className="mb-2 text-3xl font-bold tracking-tight">
                Algo deu errado!
            </h2>
            <p className="mb-8 max-w-md text-muted-foreground">
                Não conseguimos carregar a página.
            </p>
            <div className="flex gap-4">
                <button
                    className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
                    onClick={() => window.location.href = '/'}
                >
                    Voltar ao Início
                </button>
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => reset()}
                >
                    Tentar Novamente
                </button>
            </div>
        </div>
    )
}