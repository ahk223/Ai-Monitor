import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui"
import {
    MessageSquareText,
    Twitter,
    Wrench,
    BookOpen,
    TrendingUp,
    Clock,
    Star,
    ArrowUpRight,
} from "lucide-react"
import Link from "next/link"

interface PromptWithCategory {
    id: string
    title: string
    rating: number | null
    category: { id: string; name: string; color: string } | null
}

async function getDashboardStats(workspaceId: string) {
    const [promptsCount, tweetsCount, toolsCount, playbooksCount, recentPrompts, topRatedPrompts] = await Promise.all([
        prisma.prompt.count({ where: { workspaceId, isArchived: false } }),
        prisma.tweet.count({ where: { workspaceId, isArchived: false } }),
        prisma.tool.count({ where: { workspaceId, isArchived: false } }),
        prisma.playbook.count({ where: { workspaceId, isArchived: false } }),
        prisma.prompt.findMany({
            where: { workspaceId, isArchived: false },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { category: true },
        }),
        prisma.prompt.findMany({
            where: { workspaceId, isArchived: false, rating: { not: null } },
            orderBy: { rating: "desc" },
            take: 5,
            include: { category: true },
        }),
    ])

    return {
        stats: {
            prompts: promptsCount,
            tweets: tweetsCount,
            tools: toolsCount,
            playbooks: playbooksCount,
        },
        recentPrompts: recentPrompts as PromptWithCategory[],
        topRatedPrompts: topRatedPrompts as PromptWithCategory[],
    }
}

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user?.workspaceId) {
        return <div>لا توجد مساحة عمل</div>
    }

    const { stats, recentPrompts, topRatedPrompts } = await getDashboardStats(session.user.workspaceId)

    const statCards = [
        { icon: MessageSquareText, label: "البروبمتات", value: stats.prompts, color: "from-indigo-500 to-purple-500", href: "/dashboard/prompts" },
        { icon: Twitter, label: "التغريدات", value: stats.tweets, color: "from-cyan-500 to-blue-500", href: "/dashboard/tweets" },
        { icon: Wrench, label: "الأدوات", value: stats.tools, color: "from-emerald-500 to-teal-500", href: "/dashboard/tools" },
        { icon: BookOpen, label: "Playbooks", value: stats.playbooks, color: "from-orange-500 to-red-500", href: "/dashboard/playbooks" },
    ]

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 text-white shadow-xl">
                <h1 className="text-2xl font-bold">مرحباً، {session.user.name || "مستخدم"} 👋</h1>
                <p className="mt-1 text-white/80">إليك نظرة سريعة على معرفتك التشغيلية</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <Link key={stat.label} href={stat.href}>
                        <Card hover className="group cursor-pointer">
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">{stat.label}</p>
                                        <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                                            {stat.value}
                                        </p>
                                    </div>
                                    <div className={`rounded-xl bg-gradient-to-br ${stat.color} p-3 shadow-lg`}>
                                        <stat.icon className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-1 text-xs text-slate-500 group-hover:text-indigo-600">
                                    <span>عرض الكل</span>
                                    <ArrowUpRight className="h-3 w-3" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Recent & Top Rated */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Prompts */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-indigo-600" />
                            آخر البروبمتات
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentPrompts.length === 0 ? (
                            <div className="py-8 text-center text-slate-400">
                                <MessageSquareText className="mx-auto h-10 w-10 mb-2 opacity-50" />
                                <p>لا توجد بروبمتات بعد</p>
                                <Link href="/dashboard/prompts/new" className="mt-2 inline-block text-indigo-600 hover:underline">
                                    أضف أول بروبمت
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentPrompts.map((prompt: PromptWithCategory) => (
                                    <Link
                                        key={prompt.id}
                                        href={`/dashboard/prompts/${prompt.id}`}
                                        className="flex items-center justify-between rounded-xl border border-slate-100 p-3 transition-all hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:border-indigo-900 dark:hover:bg-indigo-900/10"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 truncate dark:text-white">
                                                {prompt.title}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {prompt.category?.name || "بدون تصنيف"}
                                            </p>
                                        </div>
                                        {prompt.rating && (
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <Star className="h-4 w-4 fill-amber-500" />
                                                <span className="text-sm">{prompt.rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Rated */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                            الأعلى تقييماً
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topRatedPrompts.length === 0 ? (
                            <div className="py-8 text-center text-slate-400">
                                <Star className="mx-auto h-10 w-10 mb-2 opacity-50" />
                                <p>لا توجد تقييمات بعد</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {topRatedPrompts.map((prompt: PromptWithCategory, index: number) => (
                                    <Link
                                        key={prompt.id}
                                        href={`/dashboard/prompts/${prompt.id}`}
                                        className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-all hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:border-indigo-900 dark:hover:bg-indigo-900/10"
                                    >
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold ${index === 0 ? "bg-amber-100 text-amber-700" :
                                            index === 1 ? "bg-slate-100 text-slate-700" :
                                                index === 2 ? "bg-orange-100 text-orange-700" :
                                                    "bg-slate-50 text-slate-500"
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 truncate dark:text-white">
                                                {prompt.title}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 text-amber-500">
                                            <Star className="h-4 w-4 fill-amber-500" />
                                            <span className="font-medium">{prompt.rating?.toFixed(1)}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
