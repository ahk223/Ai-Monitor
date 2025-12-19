import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getWorkspaceFromRequest, logActivity } from "@/lib/api-utils"
import { z } from "zod"

const createToolSchema = z.object({
    name: z.string().min(1, "اسم الأداة مطلوب"),
    description: z.string().optional(),
    officialUrl: z.string().optional(),
    prerequisites: z.string().optional(),
    commonMistakes: z.string().optional(),
    bestPractices: z.string().optional(),
    categoryId: z.string().optional(),
    masteryLevelId: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
})

// GET - List tools
export async function GET(req: NextRequest) {
    const workspace = await getWorkspaceFromRequest(req)
    if (!workspace) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")

    const where: Record<string, unknown> = {
        workspaceId: workspace.workspaceId,
        isArchived: false,
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ]
    }

    const tools = await prisma.tool.findMany({
        where,
        include: {
            category: true,
            masteryLevel: true,
            tags: true,
            _count: { select: { lessons: true, learningPaths: true } },
        },
        orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(tools)
}

// POST - Create tool
export async function POST(req: NextRequest) {
    const workspace = await getWorkspaceFromRequest(req)
    if (!workspace) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const parsed = createToolSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            )
        }

        const { tagIds, ...data } = parsed.data

        const tool = await prisma.tool.create({
            data: {
                ...data,
                workspaceId: workspace.workspaceId,
                tags: tagIds ? { connect: tagIds.map((id) => ({ id })) } : undefined,
            },
            include: {
                category: true,
                masteryLevel: true,
                tags: true,
            },
        })

        await logActivity(
            workspace.userId,
            workspace.workspaceId,
            "CREATE",
            "Tool",
            tool.id,
            tool.name
        )

        return NextResponse.json(tool, { status: 201 })
    } catch (error) {
        console.error("Create tool error:", error)
        return NextResponse.json(
            { error: "حدث خطأ أثناء إنشاء الأداة" },
            { status: 500 }
        )
    }
}
