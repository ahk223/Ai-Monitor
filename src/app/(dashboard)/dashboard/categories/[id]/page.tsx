"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore"
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
    GraduationCap,
    Heart
} from "lucide-react"
import Link from "next/link"
import { CourseList } from "@/components/courses/CourseList"
import { LearningList } from "@/components/learning/LearningList"


interface Category {
    id: string
    name: string
    color: string
    isFavorite?: boolean
}

interface ContentItem {
    id: string
    title?: string
    content?: string
    name?: string
    type: "prompt" | "tweet" | "tool" | "playbook" | "note" | "course" | "learning_topic"
    createdAt?: any
    images?: string[] // For prompts
    image?: string // For generic use
    url?: string
    isFavorite?: boolean // For prompts
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
    const [attachments, setAttachments] = useState<Record<string, any[]>>({})

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
                getDocs(query(collection(db, "playbooks"), where("categoryId", "==", categoryId), where("workspaceId", "==", userData?.workspaceId), where("isArchived", "==", false))),
                // Notes
                getDocs(query(collection(db, "notes"), where("categoryId", "==", categoryId), where("workspaceId", "==", userData?.workspaceId))),
                // Courses
                getDocs(query(collection(db, "courses"), where("categoryId", "==", categoryId), where("workspaceId", "==", userData?.workspaceId))),
                // Learning Topics
                getDocs(query(collection(db, "learningTopics"), where("categoryId", "==", categoryId), where("workspaceId", "==", userData?.workspaceId))),
            ]

            const results = await Promise.all(promises)
            const allContent: ContentItem[] = []

            // Prompts
            const promptDocs = results[0].docs
            promptDocs.forEach(d => {
                const data = d.data()
                allContent.push({ 
                    ...data, 
                    id: d.id, 
                    type: "prompt",
                    isFavorite: data.isFavorite ?? false
                } as ContentItem)
            })
            
            // Fetch attachments for prompts
            if (promptDocs.length > 0) {
                const promptIds = promptDocs.map(d => d.id)
                const attachmentsQuery = query(collection(db, "attachments"))
                const attachmentsSnap = await getDocs(attachmentsQuery)
                const attachmentsMap: Record<string, any[]> = {}
                
                attachmentsSnap.docs.forEach(doc => {
                    const data = doc.data()
                    if (data.promptId && promptIds.includes(data.promptId)) {
                        if (!attachmentsMap[data.promptId]) {
                            attachmentsMap[data.promptId] = []
                        }
                        attachmentsMap[data.promptId].push(data)
                    }
                })
                setAttachments(attachmentsMap)
            }
            // Tweets
            results[1].docs.forEach(d => {
                const data = d.data()
                allContent.push({ 
                    ...data, 
                    id: d.id, 
                    type: "tweet",
                    isFavorite: data.isFavorite ?? false
                } as ContentItem)
            })
            // Tools
            results[2].docs.forEach(d => {
                const data = d.data()
                allContent.push({ 
                    ...data, 
                    id: d.id, 
                    type: "tool",
                    isFavorite: data.isFavorite ?? false
                } as ContentItem)
            })
            // Playbooks
            results[3].docs.forEach(d => {
                const data = d.data()
                allContent.push({ 
                    ...data, 
                    id: d.id, 
                    type: "playbook",
                    isFavorite: data.isFavorite ?? false
                } as ContentItem)
            })
            // Notes
            results[4].docs.forEach(d => {
                const data = d.data()
                allContent.push({ 
                    ...data, 
                    id: d.id, 
                    type: "note",
                    isFavorite: data.isFavorite ?? false
                } as ContentItem)
            })
            // Courses
            results[5].docs.forEach(d => {
                const data = d.data()
                allContent.push({ 
                    ...data, 
                    id: d.id, 
                    type: "course",
                    isFavorite: data.isFavorite ?? false
                } as ContentItem)
            })
            // Learning Topics
            results[6].docs.forEach(d => {
                const data = d.data()
                allContent.push({ 
                    ...data, 
                    id: d.id, 
                    type: "learning_topic",
                    isFavorite: data.isFavorite ?? false
                } as ContentItem)
            })

            // Sort: favorites first, then by createdAt desc
            allContent.sort((a, b) => {
                const aIsFavorite = a.isFavorite ?? false
                const bIsFavorite = b.isFavorite ?? false
                
                // If one is favorite and the other isn't, favorite comes first
                if (aIsFavorite && !bIsFavorite) return -1
                if (!aIsFavorite && bIsFavorite) return 1
                
                // If both have same favorite status, sort by createdAt
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
            case "learning_topic": return BookOpen
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
            case "learning_topic": return "موضوع للتعلم"
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
            case "learning_topic": return "bg-teal-100 text-teal-700"
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
            case "course": return item.url || "#"
            case "learning_topic": return `/dashboard/learning`
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
        if (item.type === "prompt") {
            // First check attachments
            const promptAttachments = attachments[item.id] || []
            const imageAttachments = promptAttachments.filter((a: any) => a.mimeType?.startsWith("image/"))
            if (imageAttachments.length > 0) {
                return imageAttachments[0].url
            }
            // Fallback to images array if exists
            if (item.images && item.images.length > 0) {
                return item.images[0]
            }
        }
        // Could add logic for generic 'image' field if added to other types
        return null
    }

    const handleToggleCategoryFavorite = async () => {
        if (!category) return
        
        try {
            const newFavoriteStatus = !(category.isFavorite ?? false)
            await updateDoc(doc(db, "categories", categoryId), { isFavorite: newFavoriteStatus })
            setCategory({ ...category, isFavorite: newFavoriteStatus })
        } catch (error) {
            console.error("Error toggling favorite:", error)
        }
    }

    const handleToggleFavorite = async (itemId: string, itemType: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        try {
            const item = content.find(c => c.id === itemId && c.type === itemType)
            if (!item) return

            const newFavoriteStatus = !(item.isFavorite ?? false)
            
            // Determine collection name based on type
            let collectionName = ""
            switch (itemType) {
                case "prompt":
                    collectionName = "prompts"
                    break
                case "tweet":
                    collectionName = "tweets"
                    break
                case "tool":
                    collectionName = "tools"
                    break
                case "playbook":
                    collectionName = "playbooks"
                    break
                case "note":
                    collectionName = "notes"
                    break
                case "course":
                    collectionName = "courses"
                    break
                case "learning_topic":
                    collectionName = "learningTopics"
                    break
                default:
                    return
            }
            
            if (collectionName) {
                await updateDoc(doc(db, collectionName, itemId), { isFavorite: newFavoriteStatus })
                
                // Update local state and re-sort
                setContent(prevContent => {
                    const updated = prevContent.map(c => 
                        c.id === itemId && c.type === itemType
                            ? { ...c, isFavorite: newFavoriteStatus }
                            : c
                    )
                    // Re-sort: favorites first, then by createdAt
                    updated.sort((a, b) => {
                        const aIsFavorite = a.isFavorite ?? false
                        const bIsFavorite = b.isFavorite ?? false
                        
                        if (aIsFavorite && !bIsFavorite) return -1
                        if (!aIsFavorite && bIsFavorite) return 1
                        
                        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
                        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
                        return dateB.getTime() - dateA.getTime()
                    })
                    return updated
                })
            }
        } catch (error) {
            console.error("Error toggling favorite:", error)
        }
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
            <div className="flex items-center justify-between gap-4">
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
                <button
                    onClick={handleToggleCategoryFavorite}
                    className={`rounded-lg p-2 transition-colors ${
                        category.isFavorite
                            ? "text-red-500 hover:bg-red-50 hover:text-red-600"
                            : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    }`}
                    title={category.isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                >
                    <Heart className={`h-5 w-5 ${category.isFavorite ? "fill-red-500" : ""}`} />
                </button>
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
                                    <div key={`${item.type}-${item.id}`} className="relative h-full">
                                        <LinkComponent {...linkProps as any} className="block h-full">
                                            <Card hover className="relative flex flex-col h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md group">
                                                {/* Image Preview */}
                                                {imageUrl && (
                                                    <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 p-3">
                                                        <img
                                                            src={imageUrl}
                                                            alt={getTitle(item)}
                                                            className="h-full w-full object-contain rounded-lg"
                                                        />
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
                                        
                                        {/* Favorite Button for all items */}
                                        <button
                                            onClick={(e) => handleToggleFavorite(item.id, item.type, e)}
                                            className={`absolute top-2 left-2 rounded-lg p-1.5 transition-colors z-10 ${
                                                item.isFavorite
                                                    ? "text-red-500 hover:bg-red-50 hover:text-red-600 bg-white/90"
                                                    : "text-slate-400 hover:bg-white/90 hover:text-slate-600 bg-white/70"
                                            }`}
                                            title={item.isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                                        >
                                            <Heart className={`h-4 w-4 ${item.isFavorite ? "fill-red-500" : ""}`} />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
