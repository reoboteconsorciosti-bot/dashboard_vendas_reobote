import type React from "react"

// Layout Minimalista de Depuração
// Se o build passar com isso, confirmamos que o erro estava nos Providers ou CSS

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  )
}
