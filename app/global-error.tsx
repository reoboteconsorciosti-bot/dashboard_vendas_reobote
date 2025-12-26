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
                <div style={{
                    display: 'flex',
                    height: '100vh',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#000',
                    color: '#fff',
                    fontFamily: 'sans-serif'
                }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        Erro Crítico no Sistema
                    </h2>
                    <p style={{ color: '#aaa', marginBottom: '2rem' }}>
                        Ocorreu um problema irrecuperável.
                    </p>
                    <button
                        onClick={() => reset()}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Tentar Recarregar
                    </button>
                </div>
            </body>
        </html>
    )
}