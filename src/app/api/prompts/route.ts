import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getWorkspaceFromRequest, logActivity } from "@/lib/api-utils"
import { z } from "zod"
import { extractVariables } from "@/lib/utils"

const createPromptSchema = z.object({
    title: z.string().min(1, "العنوان مطلوب"),
    description: z.string().optional(),
    content: z.string().min(1, "محتوى البروبمت مطلوب"),
    categoryId: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
})

// GET - List prompts
export async function GET(req: NextRequest) {
    const workspace = await getWorkspaceFromRequest(req)
    if (!workspace) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get("categoryId")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const where: Record<string, unknown> = {
        workspaceId: workspace.workspaceId,
        isArchived: false,
    }

    if (categoryId) {
        where.categoryId = categoryId
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
        ]
    }

    const prompts = await prisma.prompt.findMany({
        where,
        include: {
            category: true,
            tags: true,
            _count: {
                select: {
                    versions: true,
                    tests: true,
                },
            },
        },
        orderBy: { [sortBy]: sortOrder },
    })

    return NextResponse.json(prompts)
}

// POST - Create prompt
export async function POST(req: NextRequest) {
    const workspace = await getWorkspaceFromRequest(req)
    if (!workspace) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const parsed = createPromptSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            )
        }

        const { title, description, content, categoryId, tagIds } = parsed.data

        // Extract variables from content
        const variables = extractVariables(content)

        // Create prompt with initial version
        const prompt = await prisma.$transaction(async (tx: typeof prisma) => {
            const newPrompt = await tx.prompt.create({
                data: {
                    title,
                    description,
                    content,
                    workspaceId: workspace.workspaceId,
                    categoryId: categoryId || null,
                    tags: tagIds ? { connect: tagIds.map((id) => ({ id })) } : undefined,
                },
                include: {
                    category: true,
                    tags: true,
                },
            })

            // Create initial version
            await tx.promptVersion.create({
                data: {
                    promptId: newPrompt.id,
                    version: 1,
                    content,
                    changeNote: "الإصدار الأول",
                },
            })

            // Create variables
            if (variables.length > 0) {
                await tx.promptVariable.createMany({
                    data: variables.map((name) => ({
                        promptId: newPrompt.id,
                        name,
                    })),
                })
            }

            return newPrompt
        })

        // Log activity
        await logActivity(
            workspace.userId,
            workspace.workspaceId,
            "CREATE",
            "Prompt",
            prompt.id,
            prompt.title
        )

        return NextResponse.json(prompt, { status: 201 })
    } catch (error) {
        console.error("Create prompt error:", error)
        return NextResponse.json(
            { error: "حدث خطأ أثناء إنشاء البروبمت" },
            { status: 500 }
        )
    }
}
