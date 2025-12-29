import Link from "next/link"



export default function NotFound() {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-zinc-950 text-white font-sans">
            <h2 className="text-4xl font-bold mb-4 text-white">404</h2>
            <p className="text-zinc-400 mb-8 text-lg">Página não encontrada.</p>
            <Link
                href="/"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
                Voltar ao Início
            </Link>
        </div>
    )
}
