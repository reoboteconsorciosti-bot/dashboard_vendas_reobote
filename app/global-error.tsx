'use client'

import { Button } from "@/components/ui/button"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body>
                <div className="flex h-screen w-full flex-col items-center justify-center bg-black p-4 text-center text-white">
                    <h2 className="mb-4 text-2xl font-bold">Erro Crítico no Sistema</h2>
                    <p className="mb-8 text-gray-400">Ocorreu um erro irrecuperável na aplicação.</p>
                    <Button onClick={() => reset()}>Tentar Recarregar</Button>
                </div>
            </body>
        </html>
    )
}
