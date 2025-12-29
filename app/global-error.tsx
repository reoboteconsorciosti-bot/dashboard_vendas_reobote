"use client"

export const dynamic = "force-static"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body className="bg-zinc-950 text-white flex items-center justify-center h-screen flex-col font-sans">
                <h2 className="text-2xl font-bold mb-4">Algo deu errado!</h2>
                <button
                    onClick={() => reset()}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
                >
                    Tentar novamente
                </button>
            </body>
        </html>
    )
}
