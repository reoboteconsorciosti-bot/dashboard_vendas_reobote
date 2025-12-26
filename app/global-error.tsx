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
            <body style={{ margin: 0, padding: 0, backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Erro Crítico</h2>
                <p style={{ color: '#ccc', marginBottom: '20px' }}>Ocorreu um erro irrecuperável no sistema.</p>
                <button
                    onClick={() => reset()}
                    style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
                >
                    Recarregar
                </button>
            </body>
        </html>
    )
}
