import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
    email: z.string().email("البريد الإلكتروني غير صالح"),
    password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
    name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
    workspaceName: z.string().min(2, "اسم مساحة العمل يجب أن يكون حرفين على الأقل"),
})

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const parsed = registerSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            )
        }

        const { email, password, name, workspaceName } = parsed.data

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "هذا البريد الإلكتروني مسجل مسبقاً" },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Generate unique slug
        let slug = workspaceName
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')

        const existingSlug = await prisma.workspace.findUnique({
            where: { slug },
        })

        if (existingSlug) {
            slug = `${slug}-${Date.now()}`
        }

        // Create user, workspace, and membership in a transaction
        const result = await prisma.$transaction(async (tx: typeof prisma) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                },
            })

            const workspace = await tx.workspace.create({
                data: {
                    name: workspaceName,
                    slug,
                },
            })

            await tx.workspaceMember.create({
                data: {
                    userId: user.id,
                    workspaceId: workspace.id,
                    role: "OWNER",
                },
            })

            // Create default categories
            const defaultCategories = [
                { name: "عام", color: "#6366f1" },
                { name: "توليد المحتوى", color: "#22c55e" },
                { name: "برمجة", color: "#3b82f6" },
                { name: "تحليل", color: "#f59e0b" },
                { name: "تسويق", color: "#ec4899" },
            ]

            await tx.category.createMany({
                data: defaultCategories.map(cat => ({
                    ...cat,
                    workspaceId: workspace.id,
                })),
            })

            // Create default benefit types
            const defaultBenefitTypes = [
                "توليد", "برمجة", "تسويق", "تحليل", "أخرى"
            ]

            await tx.taxonomyItem.createMany({
                data: defaultBenefitTypes.map((name, i) => ({
                    name,
                    order: i,
                    benefitWorkspaceId: workspace.id,
                })),
            })

            // Create default content types
            const defaultContentTypes = [
                "كورسات", "نصائح", "أدوات", "أخبار", "أخرى"
            ]

            await tx.taxonomyItem.createMany({
                data: defaultContentTypes.map((name, i) => ({
                    name,
                    order: i,
                    contentWorkspaceId: workspace.id,
                })),
            })

            // Create default mastery levels
            const defaultMasteryLevels = [
                "لم أبدأ", "أتعلم", "أستخدمها", "محترف"
            ]

            await tx.taxonomyItem.createMany({
                data: defaultMasteryLevels.map((name, i) => ({
                    name,
                    order: i,
                    masteryWorkspaceId: workspace.id,
                })),
            })

            return { user, workspace }
        })

        return NextResponse.json({
            message: "تم إنشاء الحساب بنجاح",
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
            },
            workspace: {
                id: result.workspace.id,
                name: result.workspace.name,
                slug: result.workspace.slug,
            },
        })
    } catch (error) {
        console.error("Registration error:", error)
        return NextResponse.json(
            { error: "حدث خطأ أثناء إنشاء الحساب" },
            { status: 500 }
        )
    }
}
