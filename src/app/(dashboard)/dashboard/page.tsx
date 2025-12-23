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
    GraduationCap,
    ListTodo,
    Sparkles,
    TrendingUp,
    FolderKanban,
    Zap,
} from "lucide-react"
import Link from "next/link"

interface ContentItem {
    id: string
    title?: string
    content?: string
    url?: string
    type: "prompt" | "tweet" | "tool" | "playbook" | "note" | "course" | "learning_topic"
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
    courses: number
    learningTopics: number
}

export default function DashboardPage() {
    const { userData } = useAuth()
    const [stats, setStats] = useState<Stats>({ prompts: 0, tweets: 0, tools: 0, playbooks: 0, notes: 0, courses: 0, learningTopics: 0 })
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

            // Courses
            const coursesQuery = query(
                collection(db, "courses"),
                where("workspaceId", "==", userData.workspaceId)
            )
            const coursesSnap = await getDocs(coursesQuery)
            coursesSnap.docs.forEach(doc => {
                const data = doc.data()
                allContent.push({
                    id: data.id,
                    title: data.title,
                    type: "course",
                    categoryId: data.categoryId,
                })
            })

            // Learning Topics
            const topicsQuery = query(
                collection(db, "learningTopics"),
                where("workspaceId", "==", userData.workspaceId)
            )
            const topicsSnap = await getDocs(topicsQuery)
            topicsSnap.docs.forEach(doc => {
                const data = doc.data()
                allContent.push({
                    id: data.id,
                    title: data.title,
                    type: "learning_topic",
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
                courses: coursesSnap.size,
                learningTopics: topicsSnap.size,
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
            case "course": return `/dashboard/courses`
            case "learning_topic": return `/dashboard/learning`
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
            case "course": return <GraduationCap className="h-4 w-4 text-blue-500" />
            case "learning_topic": return <ListTodo className="h-4 w-4 text-pink-500" />
            default: return null
        }
    }

    const getTypeName = (type: string) => {
        switch (type) {
            case "prompt": return "بروبمت"
            case "tweet": return "سوشيال ميديا"
            case "tool": return "أداة"
            case "playbook": return "Playbook"
            case "note": return "ملاحظة"
            case "course": return "كورس"
            case "learning_topic": return "للتعلم"
            default: return ""
        }
    }

    const statsCards = [
        { title: "البروبمتات", value: stats.prompts, icon: MessageSquareText, color: "from-indigo-500 to-purple-500", bgColor: "bg-indigo-50 dark:bg-indigo-900/20", href: "/dashboard/prompts" },
        { title: "Playbooks", value: stats.playbooks, icon: BookOpen, color: "from-orange-500 to-red-500", bgColor: "bg-orange-50 dark:bg-orange-900/20", href: "/dashboard/playbooks" },
        { title: "الكورسات", value: stats.courses, icon: GraduationCap, color: "from-blue-500 to-cyan-500", bgColor: "bg-blue-50 dark:bg-blue-900/20", href: "/dashboard/courses" },
        { title: "للتعلم", value: stats.learningTopics, icon: ListTodo, color: "from-pink-500 to-rose-500", bgColor: "bg-pink-50 dark:bg-pink-900/20", href: "/dashboard/learning" },
        { title: "الأدوات", value: stats.tools, icon: Wrench, color: "from-emerald-500 to-teal-500", bgColor: "bg-emerald-50 dark:bg-emerald-900/20", href: "/dashboard/tools" },
        { title: "السوشيال ميديا", value: stats.tweets, icon: Twitter, color: "from-cyan-500 to-blue-500", bgColor: "bg-cyan-50 dark:bg-cyan-900/20", href: "/dashboard/tweets" },
        { title: "الملاحظات", value: stats.notes, icon: StickyNote, color: "from-amber-500 to-yellow-500", bgColor: "bg-amber-50 dark:bg-amber-900/20", href: "/dashboard/notes" },
    ]

    if (!loading && userData && !userData.workspaceId) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
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
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                    حدث خطأ
                </h2>
                <p className="text-slate-500 mb-4 text-center">{error}</p>
                <Button onClick={fetchDashboardData}>إعادة المحاولة</Button>
            </div>
        )
    }

    const totalItems = stats.prompts + stats.tweets + stats.tools + stats.playbooks + stats.notes + stats.courses + stats.learningTopics

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Welcome Section - Mobile First Design */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-5 md:p-8 text-white shadow-2xl">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-5 w-5 text-yellow-300 flex-shrink-0" />
                        <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                            مرحباً، {userData?.name || "مستخدم"} 👋
                        </h1>
                    </div>
                    <p className="text-base md:text-lg opacity-90 mb-4">
                        {userData?.workspaceName || "مساحة العمل"}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm opacity-80">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 flex-shrink-0" />
                            <span>{totalItems} عنصر إجمالي</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FolderKanban className="h-4 w-4 flex-shrink-0" />
                            <span>{categories.length} تصنيف</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats - Mobile First: 2 columns on mobile, scrollable */}
            <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                    <span>الإحصائيات</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 md:gap-4">
                    {statsCards.map((stat) => (
                        <Link key={stat.title} href={stat.href}>
                            <Card className="group relative overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full">
                                <div className={`absolute inset-0 ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                <CardContent className="relative flex flex-col items-center gap-3 py-5 md:py-6">
                                    <div className={`flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        <stat.icon className="h-7 w-7 md:h-8 md:w-8 text-white" />
                                    </div>
                                    <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-none">
                                        {stat.value}
                                    </p>
                                    <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 text-center leading-tight px-1">{stat.title}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Content by Category - Mobile First */}
            <div className="space-y-3 md:space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FolderKanban className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                        <span>المحتوى حسب التصنيف</span>
                    </h2>
                    <Link href="/dashboard/categories" className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            <span className="hidden md:inline">عرض جميع التصنيفات</span>
                            <span className="md:hidden">جميع التصنيفات</span>
                            <ArrowUpRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {categories.length === 0 && uncategorized.length === 0 ? (
                    <Card className="border-2 border-dashed">
                        <CardContent className="py-12 md:py-16 text-center">
                            <FolderKanban className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 text-base md:text-lg mb-2">لا يوجد محتوى بعد</p>
                            <p className="text-sm text-slate-400">ابدأ بإضافة محتوى جديد إلى مكتبتك</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Categories - Mobile First */}
                        {categories.map(cat => {
                            const itemCount = contentByCategory[cat.id]?.length || 0
                            return (
                                <Card key={cat.id} className="border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300">
                                    <div
                                        className="w-full flex items-center justify-between p-4 md:p-5 cursor-pointer"
                                        onClick={() => toggleCategory(cat.id)}
                                    >
                                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                            <div
                                                className="h-12 w-12 md:h-14 md:w-14 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg flex-shrink-0"
                                                style={{ 
                                                    background: `linear-gradient(135deg, ${cat.color} 0%, ${cat.color}dd 100%)`,
                                                    boxShadow: `0 4px 12px ${cat.color}40`
                                                }}
                                            >
                                                {cat.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    href={`/dashboard/categories/${cat.id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="font-bold text-base md:text-lg text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block truncate"
                                                >
                                                    {cat.name}
                                                </Link>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {itemCount} {itemCount === 1 ? 'عنصر' : 'عناصر'}
                                                </p>
                                            </div>
                                            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm flex-shrink-0 ml-2">
                                                {itemCount}
                                            </Badge>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleCategory(cat.id)
                                            }}
                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
                                        >
                                            {expandedCategories[cat.id] ? (
                                                <ChevronUp className="h-5 w-5 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-slate-400" />
                                            )}
                                        </button>
                                    </div>

                                    {expandedCategories[cat.id] && itemCount > 0 && (
                                        <CardContent className="border-t border-slate-200 dark:border-slate-700 pt-0">
                                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {contentByCategory[cat.id].map(item => (
                                                    <Link
                                                        key={`${item.type}-${item.id}`}
                                                        href={getItemLink(item)}
                                                        className="flex items-center gap-3 md:gap-4 py-3 md:py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                                                    >
                                                        <div className="flex-shrink-0">
                                                            {getTypeIcon(item.type)}
                                                        </div>
                                                        <span className="flex-1 text-sm md:text-base text-slate-700 dark:text-slate-300 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                            {item.title || item.content?.substring(0, 50) + "..."}
                                                        </span>
                                                        <Badge variant="secondary" className="text-xs flex-shrink-0 hidden md:inline-flex">
                                                            {getTypeName(item.type)}
                                                        </Badge>
                                                        <ArrowUpRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                    </Link>
                                                ))}
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            )
                        })}

                        {/* Uncategorized - Mobile First */}
                        {uncategorized.length > 0 && (
                            <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                                <CardHeader className="p-4 md:p-6">
                                    <CardTitle className="flex items-center gap-3 text-base md:text-lg">
                                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                        <span>بدون تصنيف</span>
                                        <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                                            {uncategorized.length}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 md:p-6 pt-0">
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {uncategorized.map(item => (
                                            <Link
                                                key={`${item.type}-${item.id}`}
                                                href={getItemLink(item)}
                                                className="flex items-center gap-3 md:gap-4 py-3 md:py-4 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors group"
                                            >
                                                <div className="flex-shrink-0">
                                                    {getTypeIcon(item.type)}
                                                </div>
                                                <span className="flex-1 text-sm md:text-base text-slate-700 dark:text-slate-300 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {item.title || item.content?.substring(0, 50) + "..."}
                                                </span>
                                                <Badge variant="secondary" className="text-xs flex-shrink-0 hidden md:inline-flex">
                                                    {getTypeName(item.type)}
                                                </Badge>
                                                <ArrowUpRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
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
