import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
    try {
        const userId = params.userId

        if (!userId) {
            return new NextResponse("User ID is required", { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { photoUrl: true },
        })

        if (!user || !user.photoUrl) {
            // Return a default placeholder or 404. Let's return 404 so frontend shows fallback.
            return new NextResponse("Avatar not found", { status: 404 })
        }

        const photoData = user.photoUrl

        // 1. External URL -> Redirect
        if (photoData.startsWith("http")) {
            return NextResponse.redirect(photoData)
        }

        // 2. Base64 -> Serve as Image
        if (photoData.startsWith("data:image")) {
            // Extract content type and base64 data
            // standard format: data:image/png;base64,iVBORw0KGgo...
            const matches = photoData.match(/^data:(image\/([a-zA-Z]*));base64,([^"]*)$/)

            if (matches && matches.length === 4) {
                const contentType = matches[1] // e.g. image/png
                const base64Data = matches[3]
                const buffer = Buffer.from(base64Data, "base64")

                return new NextResponse(buffer, {
                    headers: {
                        "Content-Type": contentType,
                        "Cache-Control": "public, max-age=86400, immutable", // Cache for 1 day
                    },
                })
            }
        }

        // Fallback logic for raw base64 without prefix (rare but possible) or other formats
        // Assuming standard usage, if regex fails, we might return 400 or try to detect.
        // For safety/ robustness, let's assume it failed matching.
        return new NextResponse("Invalid image format", { status: 400 })

    } catch (error) {
        console.error("[Avatar API] Error serving avatar:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
