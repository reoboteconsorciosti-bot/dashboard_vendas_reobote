
export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#09090b',
            color: '#ffffff',
            fontFamily: 'sans-serif',
            textAlign: 'center'
        }}>
            <h2 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>404</h2>
            <p style={{ color: '#a1a1aa', marginBottom: '2rem', fontSize: '1.2rem' }}>
                Página não encontrada.
            </p>
            <a
                href="/"
                style={{
                    padding: '12px 24px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                }}
            >
                Voltar ao Início
            </a>
        </div>
    )
}
