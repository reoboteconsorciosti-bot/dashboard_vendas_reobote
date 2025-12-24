"use client"

import { useState, useEffect } from "react"
import { Moon, Sun, LayoutDashboard, TrendingUp, UserIcon, Tv, Database, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

export function ProfileMenu() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light")

    setTheme(initialTheme)
    document.documentElement.classList.toggle("dark", initialTheme === "dark")
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  if (!mounted) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-6 left-6 z-[100] h-9 w-9 rounded-full bg-card/60 backdrop-blur-sm border border-border/30 hover:bg-accent hover:border-border transition-all duration-200 shadow-md hover:shadow-lg opacity-50 hover:opacity-100"
        >
          <UserIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        className="w-56 bg-card/95 backdrop-blur-sm border-border/50 shadow-xl ml-6 mb-2"
      >
        <DropdownMenuLabel className="font-semibold">Menu Principal</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/" className="cursor-pointer flex items-center">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/tv-ranking" className="cursor-pointer flex items-center">
            <Tv className="mr-2 h-4 w-4" />
            <span>Ranking TV</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/analytics" className="cursor-pointer flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>Analytics</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/vendas" className="cursor-pointer flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            <span>Relatório de Vendas</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/admin/usuarios" className="cursor-pointer flex items-center">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Usuários</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/admin/auditoria" className="cursor-pointer flex items-center text-destructive focus:text-destructive">
            <Database className="mr-2 h-4 w-4" />
            <span>Auditoria de Dados</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
          {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          <span>Tema {theme === "dark" ? "Claro" : "Escuro"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
