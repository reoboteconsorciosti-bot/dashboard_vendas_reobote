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
                <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
                    <h2>Erro Crítico</h2>
                    <button onClick={() => reset()}>Tentar Novamente</button>
                </div>
            </body>
        </html>
    )
}
