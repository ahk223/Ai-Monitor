import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getWorkspaceFromRequest, logActivity } from "@/lib/api-utils"
import { z } from "zod"

const addTestSchema = z.object({
    input: z.string().optional(),
    output: z.string().min(1, "النتيجة مطلوبة"),
    isSuccess: z.boolean(),
    rating: z.number().min(1).max(5).optional(),
    notes: z.string().optional(),
    model: z.string().optional(),
})

// POST - Add test result
export async function POST(
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
        const parsed = addTestSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            )
        }

        // Verify prompt belongs to workspace
        const prompt = await prisma.prompt.findFirst({
            where: { id, workspaceId: workspace.workspaceId },
        })

        if (!prompt) {
            return NextResponse.json({ error: "البروبمت غير موجود" }, { status: 404 })
        }

        const test = await prisma.promptTest.create({
            data: {
                ...parsed.data,
                promptId: id,
            },
        })

        // Update average rating if rating provided
        if (parsed.data.rating) {
            const tests = await prisma.promptTest.findMany({
                where: { promptId: id, rating: { not: null } },
                select: { rating: true },
            })

            const avgRating = tests.reduce((sum, t) => sum + (t.rating || 0), 0) / tests.length

            await prisma.prompt.update({
                where: { id },
                data: { rating: avgRating },
            })
        }

        return NextResponse.json(test, { status: 201 })
    } catch (error) {
        console.error("Add test error:", error)
        return NextResponse.json(
            { error: "حدث خطأ أثناء إضافة نتيجة الاختبار" },
            { status: 500 }
        )
    }
}
