import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = loginSchema.safeParse(credentials)
                if (!parsed.success) return null

                const user = await prisma.user.findUnique({
                    where: { email: parsed.data.email },
                    include: {
                        workspaces: {
                            include: { workspace: true },
                            take: 1,
                        },
                    },
                })

                if (!user) return null

                const isValid = await bcrypt.compare(parsed.data.password, user.password)
                if (!isValid) return null

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.avatar,
                }
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub

                // Get user's first workspace
                const member = await prisma.workspaceMember.findFirst({
                    where: { userId: token.sub },
                    include: { workspace: true },
                    orderBy: { createdAt: 'asc' },
                })

                if (member) {
                    session.user.workspaceId = member.workspace.id
                    session.user.workspaceName = member.workspace.name
                    session.user.role = member.role
                }
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id
            }
            return token
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
})
