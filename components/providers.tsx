"use client"

import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/react"

export function Providers() {
    return (
        <>
            <Toaster />
            <Analytics />
        </>
    )
}
