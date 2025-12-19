import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getWorkspaceFromRequest } from "@/lib/api-utils"
import { z } from "zod"

const categorySchema = z.object({
    name: z.string().min(1),
    color: z.string().optional(),
    icon: z.string().optional(),
})

// GET - List categories
export async function GET(req: NextRequest) {
    const workspace = await getWorkspaceFromRequest(req)
    if (!workspace) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
        where: { workspaceId: workspace.workspaceId },
        orderBy: { name: "asc" },
    })

    return NextResponse.json(categories)
}

// POST - Create category
export async function POST(req: NextRequest) {
    const workspace = await getWorkspaceFromRequest(req)
    if (!workspace) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const parsed = categorySchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            )
        }

        const category = await prisma.category.create({
            data: {
                ...parsed.data,
                workspaceId: workspace.workspaceId,
            },
        })

        return NextResponse.json(category, { status: 201 })
    } catch (error) {
        console.error("Create category error:", error)
        return NextResponse.json(
            { error: "حدث خطأ أثناء إنشاء التصنيف" },
            { status: 500 }
        )
    }
}
