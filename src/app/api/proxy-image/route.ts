import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get("url")

    if (!url) {
        return new NextResponse("Missing URL", { status: 400 })
    }

    try {
        const response = await fetch(url)

        if (!response.ok) {
            return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status })
        }

        const contentType = response.headers.get("Content-Type")
        if (!contentType || !contentType.startsWith("image/")) {
            // Allow PDF too if needed, but primarily images
            if (contentType !== 'application/pdf') {
                // return new NextResponse("URL is not an image", { status: 400 })
            }
        }

        const blob = await response.blob()

        return new NextResponse(blob, {
            headers: {
                "Content-Type": contentType || "application/octet-stream",
                "Cache-Control": "public, max-age=86400",
                "Access-Control-Allow-Origin": "*"
            }
        })
    } catch (error) {
        console.error("Proxy error:", error)
        return new NextResponse("Error fetching image", { status: 500 })
    }
}
