'use client'

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
                    <button
                        onClick={() => reset()}
                        className="rounded bg-blue-600 px-4 py-2 font-bold text-white transition-colors hover:bg-blue-700"
                    >
                        Tentar Recarregar
                    </button>
                </div>
            </body>
        </html>
    )
}
