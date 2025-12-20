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
    Share2
} from "lucide-react"
import Link from "next/link"

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
    type: "prompt" | "tweet" | "tool" | "playbook" | "note"
    createdAt?: any
}

export default function CategoryDetailsPage() {
    const params = useParams()
    const categoryId = params.id as string
    const { userData } = useAuth()
    const router = useRouter()

    const [category, setCategory] = useState<Category | null>(null)
    const [content, setContent] = useState<ContentItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (userData?.workspaceId && categoryId) {
            fetchData()
        }
    }, [userData?.workspaceId, categoryId])

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
            default: return "bg-gray-100 text-gray-700"
        }
    }

    const getLink = (item: ContentItem) => {
        switch (item.type) {
            case "prompt": return `/dashboard/prompts/${item.id}`
            case "playbook": return `/dashboard/playbooks/${item.id}`
            case "tool": return `/dashboard/tools` // Tools usually just listed, maybe edit?
            case "tweet": return `/dashboard/tweets`
            case "note": return `/dashboard/notes`
            default: return "#"
        }
    }

    const getTitle = (item: ContentItem) => {
        if (item.title) return item.title
        if (item.name) return item.name
        if (item.content) return item.content.substring(0, 60) + (item.content.length > 60 ? "..." : "")
        return "بدون عنوان"
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!category) return null

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

            {/* Content Grid */}
            {content.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-slate-500">لا يوجد محتوى في هذا التصنيف حتى الآن</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {content.map((item) => {
                        const Icon = getTypeIcon(item.type)
                        return (
                            <Link key={`${item.type}-${item.id}`} href={getLink(item)}>
                                <Card hover className="h-full cursor-pointer transition-all hover:-translate-y-1">
                                    <CardContent className="flex h-full flex-col gap-4">
                                        <div className="flex items-start justify-between">
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getTypeColor(item.type)}`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <Badge variant="secondary" className={getTypeColor(item.type)}>
                                                {getTypeLabel(item.type)}
                                            </Badge>
                                        </div>

                                        <div>
                                            <h3 className="font-medium text-slate-900 dark:text-white line-clamp-2">
                                                {getTitle(item)}
                                            </h3>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
