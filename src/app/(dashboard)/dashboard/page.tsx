"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
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
    Loader2,
} from "lucide-react"
import Link from "next/link"

interface Prompt {
    id: string
    title: string
    rating: number | null
    category?: { name: string }
    categoryId?: string
    createdAt: Date
}

interface Stats {
    prompts: number
    tweets: number
    tools: number
    playbooks: number
}

export default function DashboardPage() {
    const { userData } = useAuth()
    const [stats, setStats] = useState<Stats>({ prompts: 0, tweets: 0, tools: 0, playbooks: 0 })
    const [recentPrompts, setRecentPrompts] = useState<Prompt[]>([])
    const [topRatedPrompts, setTopRatedPrompts] = useState<Prompt[]>([])
    const [loading, setLoading] = useState(true)
    const [categories, setCategories] = useState<Record<string, string>>({})

    useEffect(() => {
        if (userData?.workspaceId) {
            fetchDashboardData()
        }
    }, [userData?.workspaceId])

    const fetchDashboardData = async () => {
        if (!userData?.workspaceId) return

        try {
            // Fetch categories first
            const categoriesQuery = query(
                collection(db, "categories"),
                where("workspaceId", "==", userData.workspaceId)
            )
            const categoriesSnap = await getDocs(categoriesQuery)
            const catsMap: Record<string, string> = {}
            categoriesSnap.docs.forEach(doc => {
                const data = doc.data()
                catsMap[data.id] = data.name
            })
            setCategories(catsMap)

            // Fetch counts
            const promptsQuery = query(
                collection(db, "prompts"),
                where("workspaceId", "==", userData.workspaceId),
                where("isArchived", "==", false)
            )
            const promptsSnap = await getDocs(promptsQuery)

            const tweetsQuery = query(
                collection(db, "tweets"),
                where("workspaceId", "==", userData.workspaceId),
                where("isArchived", "==", false)
            )
            const tweetsSnap = await getDocs(tweetsQuery)

            const toolsQuery = query(
                collection(db, "tools"),
                where("workspaceId", "==", userData.workspaceId),
                where("isArchived", "==", false)
            )
            const toolsSnap = await getDocs(toolsQuery)

            const playbooksQuery = query(
                collection(db, "playbooks"),
                where("workspaceId", "==", userData.workspaceId),
                where("isArchived", "==", false)
            )
            const playbooksSnap = await getDocs(playbooksQuery)

            setStats({
                prompts: promptsSnap.size,
                tweets: tweetsSnap.size,
                tools: toolsSnap.size,
                playbooks: playbooksSnap.size,
            })

            // Get recent prompts (sort by createdAt)
            const allPrompts = promptsSnap.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            })) as Prompt[]

            const sorted = allPrompts.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
                const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
                return dateB.getTime() - dateA.getTime()
            })
            setRecentPrompts(sorted.slice(0, 5))

            // Get top rated
            const rated = allPrompts
                .filter(p => p.rating !== null && p.rating !== undefined)
                .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            setTopRatedPrompts(rated.slice(0, 5))

        } catch (error) {
            console.error("Error fetching dashboard data:", error)
        } finally {
            setLoading(false)
        }
    }

    const statCards = [
        { icon: MessageSquareText, label: "البروبمتات", value: stats.prompts, color: "from-indigo-500 to-purple-500", href: "/dashboard/prompts" },
        { icon: Twitter, label: "التغريدات", value: stats.tweets, color: "from-cyan-500 to-blue-500", href: "/dashboard/tweets" },
        { icon: Wrench, label: "الأدوات", value: stats.tools, color: "from-emerald-500 to-teal-500", href: "/dashboard/tools" },
        { icon: BookOpen, label: "Playbooks", value: stats.playbooks, color: "from-orange-500 to-red-500", href: "/dashboard/playbooks" },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 text-white shadow-xl">
                <h1 className="text-2xl font-bold">مرحباً، {userData?.name || "مستخدم"} 👋</h1>
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
                                {recentPrompts.map((prompt) => (
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
                                                {prompt.categoryId ? categories[prompt.categoryId] || "بدون تصنيف" : "بدون تصنيف"}
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
                                {topRatedPrompts.map((prompt, index) => (
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
