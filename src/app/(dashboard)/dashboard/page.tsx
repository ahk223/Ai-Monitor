"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from "@/components/ui"
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
    AlertCircle,
} from "lucide-react"
import Link from "next/link"

interface Prompt {
    id: string
    title: string
    rating: number | null
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
    const [error, setError] = useState<string | null>(null)
    const [categories, setCategories] = useState<Record<string, string>>({})

    useEffect(() => {
        // If no workspace, stop loading
        if (userData && !userData.workspaceId) {
            setLoading(false)
            return
        }

        if (userData?.workspaceId) {
            fetchDashboardData()
        }
    }, [userData])

    const fetchDashboardData = async () => {
        if (!userData?.workspaceId) return

        try {
            setError(null)

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

            // Get prompts and sort them
            const promptsList = promptsSnap.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            })) as Prompt[]

            // Recent prompts (sorted by creation date)
            const sorted = [...promptsList].sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
                const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
                return dateB.getTime() - dateA.getTime()
            })
            setRecentPrompts(sorted.slice(0, 5))

            // Top rated prompts
            const topRated = promptsList
                .filter(p => p.rating && p.rating > 0)
                .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                .slice(0, 5)
            setTopRatedPrompts(topRated)
        } catch (err) {
            console.error("Error fetching dashboard data:", err)
            setError("فشل تحميل البيانات. تأكد من اتصالك بالإنترنت.")
        } finally {
            setLoading(false)
        }
    }

    const statsCards = [
        { title: "البروبمتات", value: stats.prompts, icon: MessageSquareText, color: "from-indigo-500 to-purple-500", href: "/dashboard/prompts" },
        { title: "التغريدات", value: stats.tweets, icon: Twitter, color: "from-cyan-500 to-blue-500", href: "/dashboard/tweets" },
        { title: "الأدوات", value: stats.tools, icon: Wrench, color: "from-emerald-500 to-teal-500", href: "/dashboard/tools" },
        { title: "Playbooks", value: stats.playbooks, icon: BookOpen, color: "from-orange-500 to-red-500", href: "/dashboard/playbooks" },
    ]

    // No workspace case
    if (!loading && userData && !userData.workspaceId) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    لا توجد مساحة عمل
                </h2>
                <p className="text-slate-500 mb-4 text-center max-w-md">
                    يبدو أن حسابك غير مرتبط بمساحة عمل. قد تحتاج إلى إنشاء حساب جديد.
                </p>
                <Link href="/register">
                    <Button>إنشاء حساب جديد</Button>
                </Link>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    حدث خطأ
                </h2>
                <p className="text-slate-500 mb-4">{error}</p>
                <Button onClick={fetchDashboardData}>إعادة المحاولة</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                <h1 className="text-2xl font-bold">
                    مرحباً، {userData?.name || "مستخدم"} 👋
                </h1>
                <p className="mt-1 opacity-90">
                    {userData?.workspaceName || "مساحة العمل"}
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((stat) => (
                    <Link key={stat.title} href={stat.href}>
                        <Card hover className="group cursor-pointer">
                            <CardContent className="flex items-center gap-4">
                                <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                                    <stat.icon className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">{stat.title}</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {stat.value}
                                    </p>
                                </div>
                                <ArrowUpRight className="mr-auto h-5 w-5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
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
                            <p className="text-center text-slate-500 py-4">لا توجد بروبمتات بعد</p>
                        ) : (
                            <div className="space-y-3">
                                {recentPrompts.map(prompt => (
                                    <Link
                                        key={prompt.id}
                                        href={`/dashboard/prompts/${prompt.id}`}
                                        className="flex items-center justify-between rounded-xl border border-slate-100 p-3 transition-all hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                                    >
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {prompt.title}
                                            </p>
                                            {prompt.categoryId && categories[prompt.categoryId] && (
                                                <Badge variant="secondary" className="mt-1">
                                                    {categories[prompt.categoryId]}
                                                </Badge>
                                            )}
                                        </div>
                                        {prompt.rating && (
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <Star className="h-4 w-4 fill-amber-500" />
                                                <span className="text-sm font-medium">
                                                    {prompt.rating.toFixed(1)}
                                                </span>
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
                            <p className="text-center text-slate-500 py-4">لا توجد بروبمتات مُقيّمة</p>
                        ) : (
                            <div className="space-y-3">
                                {topRatedPrompts.map((prompt, index) => (
                                    <Link
                                        key={prompt.id}
                                        href={`/dashboard/prompts/${prompt.id}`}
                                        className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-all hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                                    >
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold ${index === 0 ? "bg-amber-100 text-amber-600" :
                                                index === 1 ? "bg-slate-200 text-slate-600" :
                                                    "bg-orange-100 text-orange-600"
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {prompt.title}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 text-amber-500">
                                            <Star className="h-4 w-4 fill-amber-500" />
                                            <span className="font-medium">
                                                {prompt.rating?.toFixed(1)}
                                            </span>
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
