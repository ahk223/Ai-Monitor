import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getWorkspaceFromRequest } from "@/lib/api-utils"

// GET - Global search across all entities
export async function GET(req: NextRequest) {
    const workspace = await getWorkspaceFromRequest(req)
    if (!workspace) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")
    const type = searchParams.get("type") // prompts, tweets, tools, playbooks, all

    if (!query || query.length < 2) {
        return NextResponse.json({ prompts: [], tweets: [], tools: [], playbooks: [] })
    }

    const searchConfig = {
        prompts: type === "all" || type === "prompts" || !type,
        tweets: type === "all" || type === "tweets" || !type,
        tools: type === "all" || type === "tools" || !type,
        playbooks: type === "all" || type === "playbooks" || !type,
    }

    const results: Record<string, unknown[]> = {}

    if (searchConfig.prompts) {
        results.prompts = await prisma.prompt.findMany({
            where: {
                workspaceId: workspace.workspaceId,
                isArchived: false,
                OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                    { content: { contains: query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                title: true,
                description: true,
                rating: true,
                category: { select: { name: true, color: true } },
            },
            take: 10,
        })
    }

    if (searchConfig.tweets) {
        results.tweets = await prisma.tweet.findMany({
            where: {
                workspaceId: workspace.workspaceId,
                isArchived: false,
                OR: [
                    { content: { contains: query, mode: "insensitive" } },
                    { importance: { contains: query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                content: true,
                benefitType: { select: { name: true } },
                contentType: { select: { name: true } },
            },
            take: 10,
        })
    }

    if (searchConfig.tools) {
        results.tools = await prisma.tool.findMany({
            where: {
                workspaceId: workspace.workspaceId,
                isArchived: false,
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                name: true,
                description: true,
                masteryLevel: { select: { name: true } },
            },
            take: 10,
        })
    }

    if (searchConfig.playbooks) {
        results.playbooks = await prisma.playbook.findMany({
            where: {
                workspaceId: workspace.workspaceId,
                isArchived: false,
                OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                title: true,
                description: true,
                _count: { select: { steps: true } },
            },
            take: 10,
        })
    }

    return NextResponse.json(results)
}
