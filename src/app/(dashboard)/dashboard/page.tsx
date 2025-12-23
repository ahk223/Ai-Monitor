"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore"
import { Card, CardContent, Badge, Button } from "@/components/ui"
import {
    MessageSquareText,
    Twitter,
    Wrench,
    BookOpen,
    StickyNote,
    ArrowLeft,
    Loader2,
    AlertCircle,
    GraduationCap,
    ListTodo,
    Sparkles,
    FolderKanban,
    MoreHorizontal,
    LayoutGrid,
    Calendar,
    Heart,
    Edit2
} from "lucide-react"
import Link from "next/link"
import { doc, updateDoc } from "firebase/firestore"

// --- Types ---
interface ContentItem {
    id: string
    title?: string
    content?: string
    url?: string
    type: "prompt" | "tweet" | "tool" | "playbook" | "note" | "course" | "learning_topic"
    categoryId?: string | null
    createdAt?: any
    isFavorite?: boolean
}

interface Category {
    id: string
    name: string
    color: string
    isFavorite?: boolean
}

// --- Components ---

// 1. Welcome Banner
const WelcomeBanner = ({ userName, workspaceName }: { userName?: string, workspaceName?: string }) => (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white shadow-xl mb-8">
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
                <h1 className="text-xl md:text-2xl font-bold">
                    أهلاً بك، {userName || "مستخدم"}
                </h1>
            </div>
            <p className="text-indigo-100 text-sm md:text-base">
                {workspaceName || "مساحة العمل الخاصة بك"}
            </p>
        </div>
        {/* Abstract Shapes */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute left-0 bottom-0 -mb-10 -ml-10 h-32 w-32 rounded-full bg-indigo-500/30 blur-3xl"></div>
    </div>
)

// 2. Content Card
const ContentCard = ({ item, onToggleFavorite }: { item: ContentItem, onToggleFavorite: (id: string, type: string, currentStatus: boolean) => void }) => {
    const getTypeConfig = (type: string) => {
        switch (type) {
            case "prompt": return { icon: MessageSquareText, label: "بروبمت", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" }
            case "tweet": return { icon: Twitter, label: "سوشيال", color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-900/20" }
            case "tool": return { icon: Wrench, label: "أداة", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" }
            case "playbook": return { icon: BookOpen, label: "Playbook", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" }
            case "note": return { icon: StickyNote, label: "ملاحظة", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" }
            case "course": return { icon: GraduationCap, label: "كورس", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" }
            case "learning_topic": return { icon: ListTodo, label: "تعلم", color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-900/20" }
            default: return { icon: LayoutGrid, label: "عنصر", color: "text-slate-500", bg: "bg-slate-50" }
        }
    }

    const getLink = (item: ContentItem) => {
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

    const getEditLink = (item: ContentItem) => {
        switch (item.type) {
            case "prompt": return `/dashboard/prompts/${item.id}/edit`
            case "tweet": return `/dashboard/tweets/${item.id}/edit`
            case "tool": return `/dashboard/tools/${item.id}/edit`
            case "playbook": return `/dashboard/playbooks/${item.id}/edit`
            case "note": return `/dashboard/notes/${item.id}/edit`
            case "course": return `/dashboard/courses/${item.id}/edit`
            default: return null
        }
    }

    const config = getTypeConfig(item.type)
    const Icon = config.icon
    const editLink = getEditLink(item)

    return (
        <div className="block h-full min-w-[260px] max-w-[260px] md:min-w-0 md:max-w-none snap-start relative group">
             {/* Favorite Button (Left) */}
             <button
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onToggleFavorite(item.id, item.type, item.isFavorite || false)
                }}
                className={`absolute top-3 left-3 z-20 p-1.5 rounded-full transition-all duration-200 ${
                    item.isFavorite 
                        ? "bg-rose-50 text-rose-500 opacity-100" 
                        : "bg-slate-100/50 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500"
                }`}
                title="إضافة للمفضلة"
            >
                <Heart className={`h-4 w-4 ${item.isFavorite ? "fill-current" : ""}`} />
            </button>

            {/* Edit Button (Right) */}
            {editLink && (
                <Link
                    href={editLink}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-slate-100/50 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200"
                    title="تعديل"
                >
                    <Edit2 className="h-4 w-4" />
                </Link>
            )}

            <Link href={getLink(item)} className="block h-full">
                <Card className={`h-full hover:shadow-md transition-all duration-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 ${item.isFavorite ? 'border-rose-100 dark:border-rose-900/30 bg-rose-50/10' : ''}`}>
                    <CardContent className="p-4 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg ${config.bg}`}>
                                <Icon className={`h-4 w-4 ${config.color}`} />
                            </div>
                            <Badge variant="secondary" className="text-[10px] font-normal px-2 bg-slate-100 dark:bg-slate-800 text-slate-500">
                                {config.label}
                            </Badge>
                        </div>
                        
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors pr-6">
                            {item.title || item.content?.substring(0, 50) || "بدون عنوان"}
                        </h3>
                        
                        {item.content && item.title && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                                {item.content}
                            </p>
                        )}

                        <div className="mt-auto pt-2 flex items-center text-xs text-slate-400 group-hover:text-indigo-500 transition-colors">
                            <span>عرض التفاصيل</span>
                            <ArrowLeft className="h-3 w-3 mr-1 transition-transform group-hover:-translate-x-1" />
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>
    )
}

// 3. Category Section
const CategorySection = ({ 
    category, 
    items, 
    onToggleFavorite, 
    onToggleCategoryFavorite 
}: { 
    category: Category, 
    items: ContentItem[], 
    onToggleFavorite: (id: string, type: string, currentStatus: boolean) => void,
    onToggleCategoryFavorite?: (id: string, currentStatus: boolean) => void
}) => {
    if (!items || items.length === 0) return null

    return (
        <section className="mb-8">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-3">
                    {onToggleCategoryFavorite && category.id !== 'uncategorized' && (
                        <button
                            onClick={() => onToggleCategoryFavorite(category.id, category.isFavorite || false)}
                            className={`p-1.5 rounded-full transition-all duration-200 ${
                                category.isFavorite 
                                    ? "bg-rose-50 text-rose-500" 
                                    : "text-slate-300 hover:text-rose-400 hover:bg-rose-50"
                            }`}
                        >
                            <Heart className={`h-5 w-5 ${category.isFavorite ? "fill-current" : ""}`} />
                        </button>
                    )}
                    
                    <div 
                        className="w-1.5 h-6 rounded-full" 
                        style={{ backgroundColor: category.color }}
                    />
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                        {category.name}
                    </h2>
                    <Badge variant="outline" className="text-xs rounded-full px-2 py-0.5 border-slate-200 dark:border-slate-700">
                        {items.length}
                    </Badge>
                </div>
                <Link href={`/dashboard/categories/${category.id}`}>
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-xs md:text-sm">
                        عرض الكل
                        <ArrowLeft className="h-3 w-3 mr-1" />
                    </Button>
                </Link>
            </div>

            {/* Mobile: Horizontal Scroll | Desktop: Grid */}
            <div className="flex overflow-x-auto pb-4 gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:overflow-visible snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                {items.slice(0, 6).map((item, idx) => (
                    <ContentCard key={`${item.type}-${item.id}-${idx}`} item={item} onToggleFavorite={onToggleFavorite} />
                ))}
                
                {items.length > 6 && (
                    <Link href={`/dashboard/categories/${category.id}`} className="min-w-[100px] flex items-center justify-center snap-start">
                        <div className="flex flex-col items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors p-4">
                            <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800">
                                <MoreHorizontal className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-medium">المزيد</span>
                        </div>
                    </Link>
                )}
            </div>
        </section>
    )
}

// --- Main Page Component ---
export default function DashboardPage() {
    const { userData } = useAuth()
    const [categories, setCategories] = useState<Category[]>([])
    const [contentByCategory, setContentByCategory] = useState<Record<string, ContentItem[]>>({})
    const [uncategorized, setUncategorized] = useState<ContentItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (userData && !userData.workspaceId) {
            setLoading(false)
            return
        }

        if (userData?.workspaceId) {
            fetchData()
        }
    }, [userData])

    const fetchData = async () => {
        if (!userData?.workspaceId) return

        try {
            setLoading(true)
            
            // 1. Fetch Categories
            const categoriesQuery = query(
                collection(db, "categories"),
                where("workspaceId", "==", userData.workspaceId)
            )
            const categoriesSnap = await getDocs(categoriesQuery)
            const catsList = categoriesSnap.docs.map(doc => ({ 
                ...doc.data(), 
                id: doc.id,
                isFavorite: doc.data().isFavorite || false 
            } as Category))
            
            // Sort categories: Favorites first, then Alphabetical
            catsList.sort((a, b) => {
                if (a.isFavorite && !b.isFavorite) return -1
                if (!a.isFavorite && b.isFavorite) return 1
                return a.name.localeCompare(b.name)
            })
            setCategories(catsList)

            // 2. Fetch Content from all collections
            const collections = ["prompts", "tweets", "tools", "playbooks", "notes", "courses", "learningTopics"]
            const allContent: ContentItem[] = []

            await Promise.all(collections.map(async (colName) => {
                let q = query(
                    collection(db, colName),
                    where("workspaceId", "==", userData.workspaceId)
                )
                
                try {
                    const snap = await getDocs(q)
                    snap.docs.forEach(doc => {
                        const data = doc.data()
                        if (data.isArchived) return

                        let title = data.title || data.name || data.url || ""
                        let content = data.content || data.description || ""
                        
                        // Fix for tweets that might not have title
                        if (colName === 'tweets' && !title && data.url) title = data.url
                        
                        // Fix for notes that mainly have content
                        if (colName === 'notes' && !title && data.content) {
                            title = data.content.substring(0, 60) + (data.content.length > 60 ? "..." : "")
                        }

                        allContent.push({
                            id: doc.id,
                            type: colName === 'learningTopics' ? 'learning_topic' : colName.replace('s', '') as any, // simple plural to singular
                            title,
                            content,
                            categoryId: data.categoryId,
                            createdAt: data.createdAt,
                            isFavorite: data.isFavorite || false
                        })
                    })
                } catch (e) {
                    console.error(`Error fetching ${colName}`, e)
                }
            }))

            // 3. Group Content
            organizeContent(allContent, catsList)

        } catch (err) {
            console.error("Dashboard fetch error:", err)
            setError("حدث خطأ أثناء تحميل البيانات")
        } finally {
            setLoading(false)
        }
    }

    const organizeContent = (content: ContentItem[], cats: Category[]) => {
        const grouped: Record<string, ContentItem[]> = {}
        const uncat: ContentItem[] = []

        // Initialize groups
        cats.forEach(c => grouped[c.id] = [])

        // Sort: Favorites first, then Date
        const sortFn = (a: ContentItem, b: ContentItem) => {
            if (a.isFavorite && !b.isFavorite) return -1
            if (!a.isFavorite && b.isFavorite) return 1
            
            const dateA = a.createdAt?.seconds || 0
            const dateB = b.createdAt?.seconds || 0
            return dateB - dateA
        }

        content.sort(sortFn)

        // Distribute
        content.forEach(item => {
            if (item.categoryId && grouped[item.categoryId]) {
                grouped[item.categoryId].push(item)
            } else {
                uncat.push(item)
            }
        })

        setContentByCategory(grouped)
        setUncategorized(uncat)
    }

    const handleToggleFavorite = async (id: string, type: string, currentStatus: boolean) => {
        // Optimistic update
        const newStatus = !currentStatus
        
        // Find the original list to update
        const allContent: ContentItem[] = []
        Object.values(contentByCategory).forEach(list => allContent.push(...list))
        allContent.push(...uncategorized)
        
        const updatedContent = allContent.map(item => 
            item.id === id ? { ...item, isFavorite: newStatus } : item
        )

        // Re-organize (this will re-sort)
        organizeContent(updatedContent, categories)

        // Update Database
        try {
            // Map singular type back to collection name
            const collectionMap: Record<string, string> = {
                'prompt': 'prompts',
                'tweet': 'tweets',
                'tool': 'tools',
                'playbook': 'playbooks',
                'note': 'notes',
                'course': 'courses',
                'learning_topic': 'learningTopics'
            }
            
            const collectionName = collectionMap[type]
            if (collectionName) {
                await updateDoc(doc(db, collectionName, id), {
                    isFavorite: newStatus
                })
            }
        } catch (error) {
            console.error("Error toggling favorite:", error)
            // Revert on error
            organizeContent(allContent, categories)
        }
    }

    const handleToggleCategoryFavorite = async (id: string, currentStatus: boolean) => {
        const newStatus = !currentStatus

        // Optimistic Update
        const updatedCats = categories.map(c => 
            c.id === id ? { ...c, isFavorite: newStatus } : c
        )

        // Sort: Favorites first
        updatedCats.sort((a, b) => {
            if (a.isFavorite && !b.isFavorite) return -1
            if (!a.isFavorite && b.isFavorite) return 1
            return a.name.localeCompare(b.name)
        })

        setCategories(updatedCats)

        // Update Database
        try {
            await updateDoc(doc(db, "categories", id), {
                isFavorite: newStatus
            })
        } catch (error) {
            console.error("Error toggling category favorite:", error)
            // Revert
            const reverted = categories.map(c => 
                c.id === id ? { ...c, isFavorite: currentStatus } : c
            )
            reverted.sort((a, b) => {
                if (a.isFavorite && !b.isFavorite) return -1
                if (!a.isFavorite && b.isFavorite) return 1
                return a.name.localeCompare(b.name)
            })
            setCategories(reverted)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-slate-500 text-sm">جاري تحضير مكتبتك...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 opacity-50" />
                <p className="text-slate-600 font-medium">{error}</p>
                <Button variant="outline" onClick={fetchData}>محاولة مرة أخرى</Button>
            </div>
        )
    }

    const hasContent = Object.values(contentByCategory).some(list => list.length > 0) || uncategorized.length > 0

    return (
        <div className="pb-20 md:pb-8">
            <WelcomeBanner 
                userName={userData?.name} 
                workspaceName={userData?.workspaceName} 
            />

            {!hasContent ? (
                <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                    <FolderKanban className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">المكتبة فارغة</h3>
                    <p className="text-slate-500 text-sm mt-1 mb-6">ابدأ بإضافة محتوى جديد وتصنيفه لترتيب معرفتك</p>
                    <Link href="/dashboard/categories">
                        <Button>استعراض التصنيفات</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Render Categories with Content */}
                    {categories.map(category => (
                        <CategorySection 
                            key={category.id} 
                            category={category} 
                            items={contentByCategory[category.id]} 
                            onToggleFavorite={handleToggleFavorite}
                            onToggleCategoryFavorite={handleToggleCategoryFavorite}
                        />
                    ))}

                    {/* Uncategorized Content */}
                    {uncategorized.length > 0 && (
                        <CategorySection 
                            category={{ id: 'uncategorized', name: 'بدون تصنيف', color: '#94a3b8' }} 
                            items={uncategorized} 
                            onToggleFavorite={handleToggleFavorite}
                        />
                    )}
                </div>
            )}
        </div>
    )
}
