import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export type AuthenticatedRequest = NextRequest & {
    userId: string
    workspaceId: string
    role: string
}

export async function withAuth(
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
    return async (req: NextRequest) => {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "غير مصرح" },
                { status: 401 }
            )
        }

        if (!session.user.workspaceId) {
            return NextResponse.json(
                { error: "لا توجد مساحة عمل" },
                { status: 403 }
            )
        }

        const authReq = req as AuthenticatedRequest
        authReq.userId = session.user.id
        authReq.workspaceId = session.user.workspaceId
        authReq.role = session.user.role || "MEMBER"

        return handler(authReq)
    }
}

export async function getWorkspaceFromRequest(req: NextRequest): Promise<{
    userId: string
    workspaceId: string
    role: string
} | null> {
    const session = await auth()

    if (!session?.user?.id || !session.user.workspaceId) {
        return null
    }

    return {
        userId: session.user.id,
        workspaceId: session.user.workspaceId,
        role: session.user.role || "MEMBER",
    }
}

export async function logActivity(
    userId: string,
    workspaceId: string,
    action: string,
    entityType: string,
    entityId: string,
    entityTitle?: string,
    metadata?: Record<string, unknown>
) {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                workspaceId,
                action,
                entityType,
                entityId,
                entityTitle,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
            },
        })
    } catch (error) {
        console.error("Failed to log activity:", error)
    }
}
