import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getWorkspaceFromRequest, logActivity } from "@/lib/api-utils"
import { z } from "zod"

const createTweetSchema = z.object({
    content: z.string().min(1, "المحتوى مطلوب"),
    sourceUrl: z.string().optional(),
    importance: z.string().optional(),
    howToUse: z.string().optional(),
    categoryId: z.string().optional(),
    benefitTypeId: z.string().optional(),
    contentTypeId: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
})

// GET - List tweets
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
            { content: { contains: search, mode: "insensitive" } },
            { importance: { contains: search, mode: "insensitive" } },
        ]
    }

    const tweets = await prisma.tweet.findMany({
        where,
        include: {
            category: true,
            benefitType: true,
            contentType: true,
            tags: true,
        },
        orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(tweets)
}

// POST - Create tweet
export async function POST(req: NextRequest) {
    const workspace = await getWorkspaceFromRequest(req)
    if (!workspace) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const parsed = createTweetSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            )
        }

        const { tagIds, ...data } = parsed.data

        const tweet = await prisma.tweet.create({
            data: {
                ...data,
                workspaceId: workspace.workspaceId,
                tags: tagIds ? { connect: tagIds.map((id) => ({ id })) } : undefined,
            },
            include: {
                category: true,
                benefitType: true,
                contentType: true,
                tags: true,
            },
        })

        await logActivity(
            workspace.userId,
            workspace.workspaceId,
            "CREATE",
            "Tweet",
            tweet.id,
            tweet.content.slice(0, 50)
        )

        return NextResponse.json(tweet, { status: 201 })
    } catch (error) {
        console.error("Create tweet error:", error)
        return NextResponse.json(
            { error: "حدث خطأ أثناء إنشاء التغريدة" },
            { status: 500 }
        )
    }
}
