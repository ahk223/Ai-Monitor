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
    StickyNote,
    ArrowUpRight,
    Loader2,
    AlertCircle,
    ChevronDown,
    ChevronUp,
} from "lucide-react"
import Link from "next/link"

interface ContentItem {
    id: string
    title?: string
    content?: string
    url?: string
    type: "prompt" | "tweet" | "tool" | "playbook" | "note"
    categoryId?: string | null
}

interface Category {
    id: string
    name: string
    color: string
}

interface Stats {
    prompts: number
    tweets: number
    tools: number
    playbooks: number
    notes: number
}

export default function DashboardPage() {
    const { userData } = useAuth()
    const [stats, setStats] = useState<Stats>({ prompts: 0, tweets: 0, tools: 0, playbooks: 0, notes: 0 })
    const [categories, setCategories] = useState<Category[]>([])
    const [contentByCategory, setContentByCategory] = useState<Record<string, ContentItem[]>>({})
    const [uncategorized, setUncategorized] = useState<ContentItem[]>([])
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
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

            // Fetch categories
            const categoriesQuery = query(
                collection(db, "categories"),
                where("workspaceId", "==", userData.workspaceId)
            )
            const categoriesSnap = await getDocs(categoriesQuery)
            const catsList = categoriesSnap.docs.map(doc => doc.data() as Category)
            setCategories(catsList)

            // Initialize expanded state
            const expanded: Record<string, boolean> = {}
            catsList.forEach(cat => expanded[cat.id] = true)
            setExpandedCategories(expanded)

            // Fetch all content
            const allContent: ContentItem[] = []

            // Prompts
            const promptsQuery = query(
                collection(db, "prompts"),
                where("workspaceId", "==", userData.workspaceId),
                where("isArchived", "==", false)
            )
            const promptsSnap = await getDocs(promptsQuery)
            promptsSnap.docs.forEach(doc => {
                const data = doc.data()
                allContent.push({
                    id: data.id,
                    title: data.title,
                    type: "prompt",
                    categoryId: data.categoryId,
                })
            })

            // Tweets
            const tweetsQuery = query(
                collection(db, "tweets"),
                where("workspaceId", "==", userData.workspaceId),
                where("isArchived", "==", false)
            )
            const tweetsSnap = await getDocs(tweetsQuery)
            tweetsSnap.docs.forEach(doc => {
                const data = doc.data()
                allContent.push({
                    id: data.id,
                    title: data.url,
                    url: data.url,
                    type: "tweet",
                    categoryId: data.categoryId,
                })
            })

            // Tools
            const toolsQuery = query(
                collection(db, "tools"),
                where("workspaceId", "==", userData.workspaceId),
                where("isArchived", "==", false)
            )
            const toolsSnap = await getDocs(toolsQuery)
            toolsSnap.docs.forEach(doc => {
                const data = doc.data()
                allContent.push({
                    id: data.id,
                    title: data.name,
                    type: "tool",
                    categoryId: data.categoryId,
                })
            })

            // Playbooks
            const playbooksQuery = query(
                collection(db, "playbooks"),
                where("workspaceId", "==", userData.workspaceId),
                where("isArchived", "==", false)
            )
            const playbooksSnap = await getDocs(playbooksQuery)
            playbooksSnap.docs.forEach(doc => {
                const data = doc.data()
                allContent.push({
                    id: data.id,
                    title: data.title,
                    type: "playbook",
                    categoryId: data.categoryId,
                })
            })

            // Notes
            const notesQuery = query(
                collection(db, "notes"),
                where("workspaceId", "==", userData.workspaceId)
            )
            const notesSnap = await getDocs(notesQuery)
            notesSnap.docs.forEach(doc => {
                const data = doc.data()
                allContent.push({
                    id: data.id,
                    content: data.content,
                    type: "note",
                    categoryId: data.categoryId,
                })
            })

            // Set stats
            setStats({
                prompts: promptsSnap.size,
                tweets: tweetsSnap.size,
                tools: toolsSnap.size,
                playbooks: playbooksSnap.size,
                notes: notesSnap.size,
            })

            // Group by category
            const byCategory: Record<string, ContentItem[]> = {}
            const uncat: ContentItem[] = []

            catsList.forEach(cat => {
                byCategory[cat.id] = []
            })

            allContent.forEach(item => {
                if (item.categoryId && byCategory[item.categoryId]) {
                    byCategory[item.categoryId].push(item)
                } else {
                    uncat.push(item)
                }
            })

            setContentByCategory(byCategory)
            setUncategorized(uncat)
        } catch (err) {
            console.error("Error fetching dashboard data:", err)
            setError("فشل تحميل البيانات. تأكد من اتصالك بالإنترنت.")
        } finally {
            setLoading(false)
        }
    }

    const toggleCategory = (catId: string) => {
        setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }))
    }

    const getItemLink = (item: ContentItem) => {
        switch (item.type) {
            case "prompt": return `/dashboard/prompts/${item.id}`
            case "tweet": return `/dashboard/tweets`
            case "tool": return `/dashboard/tools`
            case "playbook": return `/dashboard/playbooks/${item.id}`
            case "note": return `/dashboard/notes`
            default: return "#"
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "prompt": return <MessageSquareText className="h-4 w-4 text-indigo-500" />
            case "tweet": return <Twitter className="h-4 w-4 text-cyan-500" />
            case "tool": return <Wrench className="h-4 w-4 text-emerald-500" />
            case "playbook": return <BookOpen className="h-4 w-4 text-orange-500" />
            case "note": return <StickyNote className="h-4 w-4 text-amber-500" />
            default: return null
        }
    }

    const getTypeName = (type: string) => {
        switch (type) {
            case "prompt": return "بروبمت"
            case "tweet": return "تغريدة"
            case "tool": return "أداة"
            case "playbook": return "Playbook"
            case "note": return "ملاحظة"
            default: return ""
        }
    }

    const statsCards = [
        { title: "البروبمتات", value: stats.prompts, icon: MessageSquareText, color: "from-indigo-500 to-purple-500", href: "/dashboard/prompts" },
        { title: "التغريدات", value: stats.tweets, icon: Twitter, color: "from-cyan-500 to-blue-500", href: "/dashboard/tweets" },
        { title: "الأدوات", value: stats.tools, icon: Wrench, color: "from-emerald-500 to-teal-500", href: "/dashboard/tools" },
        { title: "Playbooks", value: stats.playbooks, icon: BookOpen, color: "from-orange-500 to-red-500", href: "/dashboard/playbooks" },
        { title: "الملاحظات", value: stats.notes, icon: StickyNote, color: "from-amber-500 to-yellow-500", href: "/dashboard/notes" },
    ]

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
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {statsCards.map((stat) => (
                    <Link key={stat.title} href={stat.href}>
                        <Card hover className="group cursor-pointer">
                            <CardContent className="flex flex-col items-center gap-2 py-4">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-slate-500">{stat.title}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Content by Category */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    المحتوى حسب التصنيف
                </h2>

                {categories.length === 0 && uncategorized.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-slate-500">لا يوجد محتوى بعد</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Categories */}
                        {categories.map(cat => (
                            <Card key={cat.id}>
                                <button
                                    onClick={() => toggleCategory(cat.id)}
                                    className="w-full flex items-center justify-between p-4 text-right hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-4 w-4 rounded-full"
                                            style={{ backgroundColor: cat.color }}
                                        />
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {cat.name}
                                        </span>
                                        <Badge variant="secondary">
                                            {contentByCategory[cat.id]?.length || 0}
                                        </Badge>
                                    </div>
                                    {expandedCategories[cat.id] ? (
                                        <ChevronUp className="h-5 w-5 text-slate-400" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-slate-400" />
                                    )}
                                </button>

                                {expandedCategories[cat.id] && contentByCategory[cat.id]?.length > 0 && (
                                    <CardContent className="border-t pt-0">
                                        <div className="divide-y dark:divide-slate-800">
                                            {contentByCategory[cat.id].map(item => (
                                                <Link
                                                    key={`${item.type}-${item.id}`}
                                                    href={getItemLink(item)}
                                                    className="flex items-center gap-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors -mx-4 px-4"
                                                >
                                                    {getTypeIcon(item.type)}
                                                    <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">
                                                        {item.title || item.content?.substring(0, 50) + "..."}
                                                    </span>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {getTypeName(item.type)}
                                                    </Badge>
                                                </Link>
                                            ))}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        ))}

                        {/* Uncategorized */}
                        {uncategorized.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <span>بدون تصنيف</span>
                                        <Badge variant="secondary">{uncategorized.length}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="divide-y dark:divide-slate-800">
                                        {uncategorized.map(item => (
                                            <Link
                                                key={`${item.type}-${item.id}`}
                                                href={getItemLink(item)}
                                                className="flex items-center gap-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors -mx-4 px-4"
                                            >
                                                {getTypeIcon(item.type)}
                                                <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">
                                                    {item.title || item.content?.substring(0, 50) + "..."}
                                                </span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {getTypeName(item.type)}
                                                </Badge>
                                            </Link>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
