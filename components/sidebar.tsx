"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, TrendingUp, Tv, Users, LogOut, Menu, X, FileText, Database } from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onClose?: () => void
}

export function Sidebar({ className, onClose, ...props }: SidebarProps) {
    const pathname = usePathname()

    const routes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/",
            active: pathname === "/",
        },
        {
            label: "Analytics",
            icon: TrendingUp,
            href: "/analytics",
            active: pathname === "/analytics",
        },
        {
            label: "Relatório de Vendas",
            icon: FileText,
            href: "/vendas",
            active: pathname === "/vendas",
        },
        {
            label: "Ranking TV",
            icon: Tv,
            href: "/tv-ranking",
            active: pathname === "/tv-ranking",
            external: true // Visual cue that this takes full screen
        },
        {
            label: "Usuários",
            icon: Users,
            href: "/admin/usuarios",
            active: pathname === "/admin/usuarios",
        },
        {
            label: "Auditoria",
            icon: Database,
            href: "/admin/auditoria",
            active: pathname === "/admin/auditoria",
        },
    ]

    return (
        <div className={cn("pb-12 min-h-screen relative", className)} {...props}>
            <div className="space-y-4 py-4">
                <div className="px-6 py-2 flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {/* Logo Placeholder - You can replace with Image */}
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20">
                            R
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight">Reobote</h2>
                            <p className="text-xs text-muted-foreground font-medium">Dashboard Vendas</p>
                        </div>
                    </div>
                    {onClose && (
                        <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden text-muted-foreground">
                            <X className="w-5 h-5" />
                        </Button>
                    )}
                </div>
                <div className="px-3 py-2">
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Button
                                key={route.href}
                                variant={route.active ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start h-11 mb-1 transition-all duration-200 ease-in-out group relative overflow-hidden",
                                    route.active
                                        ? "bg-primary/10 text-primary font-bold shadow-sm hover:bg-primary/15"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                                asChild
                                onClick={onClose}
                            >
                                <Link href={route.href}>
                                    <div className={cn(
                                        "absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full transition-all duration-300",
                                        route.active ? "opacity-100 h-full" : "opacity-0 h-0 group-hover:h-2/3 group-hover:opacity-30 group-hover:top-1/2 group-hover:-translate-y-1/2"
                                    )} />
                                    <route.icon className={cn("h-5 w-5 mr-3 transition-colors", route.active ? "text-primary" : "group-hover:text-primary")} />
                                    {route.label}
                                    {route.external && (
                                        <span className="ml-auto text-[10px] bg-muted border border-border/50 px-1.5 py-0.5 rounded text-muted-foreground group-hover:border-primary/20 transition-colors">
                                            Full
                                        </span>
                                    )}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer / User Section */}
            <div className="absolute bottom-4 left-0 right-0 px-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-card to-card/50 border border-border/40 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                            <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">Usuário</p>
                            <p className="text-xs text-muted-foreground truncate">Logado</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full h-8 text-xs border-dashed text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-colors">
                        <LogOut className="w-3 h-3 mr-2" />
                        Sair
                    </Button>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-semibold hover:text-primary/60 transition-colors cursor-default">
                        Reobote v2.0
                    </p>
                </div>
            </div>
        </div>
    )
}
