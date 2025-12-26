import React from 'react'

// Forçamos o modo dinâmico para toda a seção administrativa
// Isso evita erros de "useContext" durante o Prerender estático do build
// pois páginas de dashboard devem ser geradas no servidor (SSR) e não estáticas.
export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
