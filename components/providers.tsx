"use client"

import { useState, useEffect } from "react"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/react"

export function Providers() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return (
        <>
        </>
    )

    return (
        <>
            {/* <Toaster /> */}
            {/* <Analytics /> */}
        </>
    )
}
