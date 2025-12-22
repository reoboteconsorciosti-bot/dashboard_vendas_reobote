"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BackButton() {
  const router = useRouter()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => router.back()}
      className="fixed top-6 right-6 z-50 h-10 w-10 rounded-full bg-card/80 backdrop-blur-md border border-border/40 hover:bg-accent hover:border-border transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 group"
      aria-label="Voltar"
    >
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
    </Button>
  )
}
