"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface DashboardShellProps {
    children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 z-50 bg-background/60 backdrop-blur-xl border-r border-border/40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] transition-transform duration-300">
                <Sidebar className="px-2" />
            </aside>

            {/* Mobile Sidebar (Drawer) */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full shadow-lg border-primary/20 bg-background/80 backdrop-blur-md">
                            <Menu className="h-5 w-5 text-primary" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72 bg-background/95 backdrop-blur-xl border-r border-border/50">
                        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Main Content Area */}
            {/* Added pl-0 md:pl-72 to offset the fixed sidebar width on desktop */}
            <main className="flex-1 w-full md:pl-72 transition-all duration-300">
                <div className="h-full w-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
