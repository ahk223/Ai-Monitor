"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { Card, CardContent, Badge, Button } from "@/components/ui"
import {
    MessageSquareText,
    Twitter,
    Wrench,
    BookOpen,
    Loader2,
    ArrowRight,
    StickyNote,
    Share2,
    GraduationCap
} from "lucide-react"
import Link from "next/link"
import { CourseList } from "@/components/courses/CourseList"
import { LearningList } from "@/components/learning/LearningList"


interface Category {
    id: string
    name: string
    color: string
}

interface ContentItem {
    id: string
    title?: string
    content?: string
    name?: string
    type: "prompt" | "tweet" | "tool" | "playbook" | "note" | "course"
    createdAt?: any
    images?: string[] // For prompts
    image?: string // For generic use
    url?: string
}

export default function CategoryDetailsPage() {
    const params = useParams()
    const categoryId = params.id as string
    const { userData } = useAuth()
    const router = useRouter()

    const [category, setCategory] = useState<Category | null>(null)
    const [content, setContent] = useState<ContentItem[]>([])
    const [filteredContent, setFilteredContent] = useState<ContentItem[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("all")

    useEffect(() => {
        if (userData?.workspaceId && categoryId) {
            fetchData()
        }
    }, [userData?.workspaceId, categoryId])

    useEffect(() => {
        if (filter === "all") {
            setFilteredContent(content)
        } else {
            setFilteredContent(content.filter(item => item.type === filter))
        }
    }, [filter, content])

    // Update Page Title
    useEffect(() => {
        if (category) {
            document.title = `${category.name} | AI Knowledge Hub`
        }
    }, [category])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch Category
            const catDoc = await getDoc(doc(db, "categories", categoryId))
            if (!catDoc.exists()) {
                router.push("/dashboard")
                return
            }
            setCategory(catDoc.data() as Category)

            // Fetch Content
            const promises = [
                // Prompts
                getDocs(query(collection(db, "prompts"), where("categoryId", "==", categoryId), where("workspaceId", "==", userData?.workspaceId))),
                // Tweets (Social Media)
                getDocs(query(collection(db, "tweets"), where("categoryId", "==", categoryId), where("workspaceId", "==", userData?.workspaceId))),
                // Tools
                getDocs(query(collection(db, "tools"), where("categoryId", "==", categoryId), where("workspaceId", "==", userData?.workspaceId))),
                // Playbooks
                getDocs(query(collection(db, "playbooks"), where("categoryId", "==", categoryId), where("workspaceId", "==", userData?.workspaceId))),
                // Notes
                getDocs(query(collection(db, "notes"), where("categoryId", "==", categoryId), where("workspaceId", "==", userData?.workspaceId))),
                // Courses
                getDocs(query(collection(db, "courses"), where("categoryId", "==", categoryId), where("workspaceId", "==", userData?.workspaceId))),
            ]

            const results = await Promise.all(promises)
            const allContent: ContentItem[] = []

            // Prompts
            results[0].docs.forEach(d => allContent.push({ ...d.data(), id: d.id, type: "prompt" } as any))
            // Tweets
            results[1].docs.forEach(d => allContent.push({ ...d.data(), id: d.id, type: "tweet" } as any))
            // Tools
            results[2].docs.forEach(d => allContent.push({ ...d.data(), id: d.id, type: "tool" } as any))
            // Playbooks
            results[3].docs.forEach(d => allContent.push({ ...d.data(), id: d.id, type: "playbook" } as any))
            // Notes
            results[4].docs.forEach(d => allContent.push({ ...d.data(), id: d.id, type: "note" } as any))
            // Courses
            results[5].docs.forEach(d => allContent.push({ ...d.data(), id: d.id, type: "course" } as any))

            // Sort by createdAt desc
            allContent.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
                return dateB.getTime() - dateA.getTime()
            })

            setContent(allContent)

        } catch (error) {
            console.error("Error fetching category details:", error)
        } finally {
            setLoading(false)
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "prompt": return MessageSquareText
            case "tweet": return Share2
            case "tool": return Wrench
            case "playbook": return BookOpen
            case "note": return StickyNote
            case "course": return GraduationCap
            default: return MessageSquareText
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "prompt": return "بروبمت"
            case "tweet": return "سوشيال ميديا"
            case "tool": return "أداة"
            case "playbook": return "Playbook"
            case "note": return "ملاحظة"
            case "course": return "كورس"
            default: return type
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case "prompt": return "bg-indigo-100 text-indigo-700"
            case "tweet": return "bg-cyan-100 text-cyan-700"
            case "tool": return "bg-emerald-100 text-emerald-700"
            case "playbook": return "bg-orange-100 text-orange-700"
            case "note": return "bg-amber-100 text-amber-700"
            case "course": return "bg-violet-100 text-violet-700"
            default: return "bg-gray-100 text-gray-700"
        }
    }

    const getLink = (item: ContentItem) => {
        switch (item.type) {
            case "prompt": return `/dashboard/prompts/${item.id}`
            case "playbook": return `/dashboard/playbooks/${item.id}`
            case "tool": return `/dashboard/tools`
            case "tweet": return `/dashboard/tweets`
            case "note": return `/dashboard/notes`
            case "course": return item.url || "#" // Courses link externally primarily, or maybe we want a details page? For now external.
            default: return "#"
        }
    }

    // Check if item should open in new tab (external links)
    const isExternalLink = (item: ContentItem) => {
        return item.type === "course"
    }

    const getTitle = (item: ContentItem) => {
        if (item.title) return item.title
        if (item.name) return item.name
        if (item.content) return item.content.substring(0, 60) + (item.content.length > 60 ? "..." : "")
        return "بدون عنوان"
    }

    // Helper to get image URL if exists
    const getItemImage = (item: ContentItem) => {
        if (item.type === "prompt" && item.images && item.images.length > 0) {
            return item.images[0]
        }
        // Could add logic for generic 'image' field if added to other types
        return null
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!category) return null

    const filters = [
        { id: "all", label: "الكل" },
        { id: "prompt", label: "البرومبتات" },
        { id: "playbook", label: "Playbooks" },
        { id: "course", label: "الكورسات" },
        { id: "learning_topic", label: "مواضيع للتعلم" },
        { id: "tweet", label: "محتوى" },
        { id: "tool", label: "الأدوات" },
        { id: "note", label: "الملاحظات" },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white">
                        <span
                            className="inline-block h-4 w-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                    </h1>
                    <p className="text-slate-500">
                        {content.length} عنصر في هذا التصنيف
                    </p>
                </div>
            </div>

            {/* Actions for current filter */}
            {filter !== 'all' && filter !== 'learning_topic' && (
                <div className="flex justify-end">
                    <Link
                        href={`/dashboard/${filter}s/new?categoryId=${categoryId}`}
                        className="inline-flex"
                    >
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <ArrowRight className="h-4 w-4 ml-2" />
                            إضافة {getTypeLabel(filter)} جديد
                        </Button>
                    </Link>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                {filters.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f.id
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Content Grid */}
            {filter === 'course' ? (
                <CourseList categoryId={categoryId} categoryName={category.name} />
            ) : filter === 'learning_topic' ? (
                <LearningList categoryId={categoryId} categoryName={category.name} />
            ) : (
                <>
                    {filteredContent.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-slate-500">لا يوجد محتوى في هذا التصنيف</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredContent.map((item) => {
                                const Icon = getTypeIcon(item.type)
                                const imageUrl = getItemImage(item)
                                const LinkComponent = isExternalLink(item) ? 'a' : Link
                                const linkProps = isExternalLink(item)
                                    ? { href: getLink(item), target: '_blank', rel: 'noopener noreferrer' }
                                    : { href: getLink(item) }

                                return (
                                    <LinkComponent key={`${item.type}-${item.id}`} {...linkProps as any} className="block h-full">
                                        <Card hover className="relative flex flex-col h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md group">
                                            {/* Image Preview */}
                                            {imageUrl && (
                                                <div className="h-32 w-full bg-slate-100 dark:bg-slate-800 relative">
                                                    <img
                                                        src={imageUrl}
                                                        alt={getTitle(item)}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            )}

                                            <div className="flex-1 flex flex-col justify-between p-4 bg-white dark:bg-slate-950">
                                                <div className="flex items-start justify-between mb-3 gap-2">
                                                    <Icon className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                                                    <Badge variant="secondary" className={`${getTypeColor(item.type)} border-0 whitespace-nowrap`}>
                                                        {getTypeLabel(item.type)}
                                                    </Badge>
                                                </div>

                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2 text-right leading-relaxed group-hover:text-indigo-600 transition-colors">
                                                        {getTitle(item)}
                                                    </h3>
                                                </div>
                                            </div>
                                        </Card>
                                    </LinkComponent>
                                )
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
