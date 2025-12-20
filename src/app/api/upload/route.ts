import { NextRequest, NextResponse } from "next/server"
import { put, del } from "@vercel/blob"
import { getWorkspaceFromRequest } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

// POST - Upload file
export async function POST(req: NextRequest) {
    const workspace = await getWorkspaceFromRequest(req)
    if (!workspace) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get("file") as File | null
        const promptId = formData.get("promptId") as string | null
        const tweetId = formData.get("tweetId") as string | null
        const toolId = formData.get("toolId") as string | null

        if (!file) {
            return NextResponse.json({ error: "الملف مطلوب" }, { status: 400 })
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "نوع الملف غير مدعوم. الأنواع المسموحة: JPG, PNG, GIF, WebP, PDF" },
                { status: 400 }
            )
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "حجم الملف كبير جداً. الحد الأقصى 5MB" },
                { status: 400 }
            )
        }

        // Upload to Vercel Blob
        const blob = await put(`attachments/${workspace.workspaceId}/${Date.now()}-${file.name}`, file, {
            access: "public",
        })

        // Save to database
        const attachment = await prisma.attachment.create({
            data: {
                filename: blob.pathname,
                originalName: file.name,
                mimeType: file.type,
                size: file.size,
                url: blob.url,
                promptId: promptId || null,
                tweetId: tweetId || null,
                toolId: toolId || null,
            },
        })

        return NextResponse.json(attachment, { status: 201 })
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json(
            { error: "حدث خطأ أثناء رفع الملف" },
            { status: 500 }
        )
    }
}

// DELETE - Delete file
export async function DELETE(req: NextRequest) {
    const workspace = await getWorkspaceFromRequest(req)
    if (!workspace) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "معرف الملف مطلوب" }, { status: 400 })
        }

        const attachment = await prisma.attachment.findUnique({
            where: { id },
        })

        if (!attachment) {
            return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 })
        }

        // Delete from Vercel Blob
        await del(attachment.url)

        // Delete from database
        await prisma.attachment.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete error:", error)
        return NextResponse.json(
            { error: "حدث خطأ أثناء حذف الملف" },
            { status: 500 }
        )
    }
}
