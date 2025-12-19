import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getWorkspaceFromRequest, logActivity } from "@/lib/api-utils"
import { z } from "zod"

const createPlaybookSchema = z.object({
    title: z.string().min(1, "العنوان مطلوب"),
    description: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
    steps: z.array(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        order: z.number(),
        promptIds: z.array(z.string()).optional(),
        toolIds: z.array(z.string()).optional(),
        tweetIds: z.array(z.string()).optional(),
    })).optional(),
})

// GET - List playbooks
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
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ]
    }

    const playbooks = await prisma.playbook.findMany({
        where,
        include: {
            tags: true,
            _count: { select: { steps: true } },
        },
        orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(playbooks)
}

// POST - Create playbook
export async function POST(req: NextRequest) {
    const workspace = await getWorkspaceFromRequest(req)
    if (!workspace) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const parsed = createPlaybookSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            )
        }

        const { tagIds, steps, ...data } = parsed.data

        const playbook = await prisma.$transaction(async (tx) => {
            const newPlaybook = await tx.playbook.create({
                data: {
                    ...data,
                    workspaceId: workspace.workspaceId,
                    tags: tagIds ? { connect: tagIds.map((id) => ({ id })) } : undefined,
                },
            })

            if (steps && steps.length > 0) {
                for (const step of steps) {
                    await tx.playbookStep.create({
                        data: {
                            title: step.title,
                            description: step.description,
                            order: step.order,
                            playbookId: newPlaybook.id,
                            prompts: step.promptIds ? { connect: step.promptIds.map((id) => ({ id })) } : undefined,
                            tools: step.toolIds ? { connect: step.toolIds.map((id) => ({ id })) } : undefined,
                            tweets: step.tweetIds ? { connect: step.tweetIds.map((id) => ({ id })) } : undefined,
                        },
                    })
                }
            }

            return newPlaybook
        })

        const fullPlaybook = await prisma.playbook.findUnique({
            where: { id: playbook.id },
            include: {
                tags: true,
                steps: {
                    include: {
                        prompts: true,
                        tools: true,
                        tweets: true,
                    },
                    orderBy: { order: "asc" },
                },
            },
        })

        await logActivity(
            workspace.userId,
            workspace.workspaceId,
            "CREATE",
            "Playbook",
            playbook.id,
            playbook.title
        )

        return NextResponse.json(fullPlaybook, { status: 201 })
    } catch (error) {
        console.error("Create playbook error:", error)
        return NextResponse.json(
            { error: "حدث خطأ أثناء إنشاء الـPlaybook" },
            { status: 500 }
        )
    }
}
