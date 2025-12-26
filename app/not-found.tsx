'use client'

// Página 404 Personalizada e Leve
// Evita erros de Contexto durante o Build

import Link from 'next/link'

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
            <Link
                href="/"
                style={{
                    padding: '12px 24px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold'
                }}
            >
                Voltar ao Início
            </Link>
        </div>
    )
}
