import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getWorkspaceFromRequest, logActivity } from "@/lib/api-utils"
import { z } from "zod"
import { extractVariables } from "@/lib/utils"

const updatePromptSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    content: z.string().min(1).optional(),
    categoryId: z.string().nullable().optional(),
    tagIds: z.array(z.string()).optional(),
    rating: z.number().min(1).max(5).optional(),
    changeNote: z.string().optional(),
})

// GET - Get single prompt
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const workspace = await getWorkspaceFromRequest(req)
    if (!workspace) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { id } = await params

    const prompt = await prisma.prompt.findFirst({
        where: {
            id,
            workspaceId: workspace.workspaceId,
        },
        include: {
            category: true,
            tags: true,
            versions: {
                orderBy: { version: "desc" },
            },
            variables: true,
            tests: {
                orderBy: { createdAt: "desc" },
            },
            usageLogs: {
                orderBy: { createdAt: "desc" },
                take: 10,
            },
            linkedTweets: {
                select: { id: true, content: true },
            },
            linkedTools: {
                select: { id: true, name: true },
            },
            attachments: true,
        },
    })

    if (!prompt) {
        return NextResponse.json({ error: "البروبمت غير موجود" }, { status: 404 })
    }

    // Increment usage count
    await prisma.prompt.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
    })

    return NextResponse.json(prompt)
}

// PUT - Update prompt
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const workspace = await getWorkspaceFromRequest(req)
    if (!workspace) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { id } = await params

    try {
        const body = await req.json()
        const parsed = updatePromptSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            )
        }

        const existingPrompt = await prisma.prompt.findFirst({
            where: { id, workspaceId: workspace.workspaceId },
            include: { versions: { orderBy: { version: "desc" }, take: 1 } },
        })

        if (!existingPrompt) {
            return NextResponse.json({ error: "البروبمت غير موجود" }, { status: 404 })
        }

        const { content, changeNote, tagIds, ...otherData } = parsed.data

        // Update prompt
        const updateData: Record<string, unknown> = { ...otherData }

        if (tagIds) {
            updateData.tags = {
                set: tagIds.map((tagId) => ({ id: tagId })),
            }
        }

        if (content && content !== existingPrompt.content) {
            updateData.content = content

            // Create new version
            const lastVersion = existingPrompt.versions[0]?.version || 0
            await prisma.promptVersion.create({
                data: {
                    promptId: id,
                    version: lastVersion + 1,
                    content,
                    changeNote: changeNote || `تحديث الإصدار ${lastVersion + 1}`,
                },
            })

            // Update variables
            const newVariables = extractVariables(content)
            await prisma.promptVariable.deleteMany({ where: { promptId: id } })
            if (newVariables.length > 0) {
                await prisma.promptVariable.createMany({
                    data: newVariables.map((name) => ({
                        promptId: id,
                        name,
                    })),
                })
            }
        }

        const prompt = await prisma.prompt.update({
            where: { id },
            data: updateData,
            include: {
                category: true,
                tags: true,
                versions: { orderBy: { version: "desc" } },
                variables: true,
            },
        })

        await logActivity(
            workspace.userId,
            workspace.workspaceId,
            "UPDATE",
            "Prompt",
            prompt.id,
            prompt.title
        )

        return NextResponse.json(prompt)
    } catch (error) {
        console.error("Update prompt error:", error)
        return NextResponse.json(
            { error: "حدث خطأ أثناء تحديث البروبمت" },
            { status: 500 }
        )
    }
}

// DELETE - Archive prompt
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const workspace = await getWorkspaceFromRequest(req)
    if (!workspace) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { id } = await params

    const prompt = await prisma.prompt.findFirst({
        where: { id, workspaceId: workspace.workspaceId },
    })

    if (!prompt) {
        return NextResponse.json({ error: "البروبمت غير موجود" }, { status: 404 })
    }

    await prisma.prompt.update({
        where: { id },
        data: { isArchived: true },
    })

    await logActivity(
        workspace.userId,
        workspace.workspaceId,
        "DELETE",
        "Prompt",
        prompt.id,
        prompt.title
    )

    return NextResponse.json({ success: true })
}
