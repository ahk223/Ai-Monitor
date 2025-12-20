"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { Card, CardContent, Badge } from "@/components/ui"
import {
    Search,
    MessageSquareText,
    Twitter,
    Wrench,
    BookOpen,
    Loader2,
} from "lucide-react"
import Link from "next/link"

interface SearchResult {
    id: string
    type: "prompt" | "tweet" | "tool" | "playbook"
    title: string
    description: string | null
}

export default function SearchPage() {
    const { userData } = useAuth()
    const [searchQuery, setSearchQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    const handleSearch = async () => {
        if (!userData?.workspaceId || !searchQuery.trim()) return

        setLoading(true)
        setHasSearched(true)

        try {
            const allResults: SearchResult[] = []
            const searchLower = searchQuery.toLowerCase()

            // Search prompts
            const promptsQuery = query(
                collection(db, "prompts"),
                where("workspaceId", "==", userData.workspaceId),
                where("isArchived", "==", false)
            )
            const promptsSnap = await getDocs(promptsQuery)
            promptsSnap.docs.forEach(doc => {
                const data = doc.data()
                if (data.title.toLowerCase().includes(searchLower) ||
                    data.content.toLowerCase().includes(searchLower)) {
                    allResults.push({
                        id: doc.id,
                        type: "prompt",
                        title: data.title,
                        description: data.description,
                    })
                }
            })

            // Search tweets
            const tweetsQuery = query(
                collection(db, "tweets"),
                where("workspaceId", "==", userData.workspaceId),
                where("isArchived", "==", false)
            )
            const tweetsSnap = await getDocs(tweetsQuery)
            tweetsSnap.docs.forEach(doc => {
                const data = doc.data()
                if (data.content.toLowerCase().includes(searchLower)) {
                    allResults.push({
                        id: doc.id,
                        type: "tweet",
                        title: data.content.substring(0, 50) + "...",
                        description: data.importance,
                    })
                }
            })

            // Search tools
            const toolsQuery = query(
                collection(db, "tools"),
                where("workspaceId", "==", userData.workspaceId),
                where("isArchived", "==", false)
            )
            const toolsSnap = await getDocs(toolsQuery)
            toolsSnap.docs.forEach(doc => {
                const data = doc.data()
                if (data.name.toLowerCase().includes(searchLower) ||
                    (data.description && data.description.toLowerCase().includes(searchLower))) {
                    allResults.push({
                        id: doc.id,
                        type: "tool",
                        title: data.name,
                        description: data.description,
                    })
                }
            })

            // Search playbooks
            const playbooksQuery = query(
                collection(db, "playbooks"),
                where("workspaceId", "==", userData.workspaceId),
                where("isArchived", "==", false)
            )
            const playbooksSnap = await getDocs(playbooksQuery)
            playbooksSnap.docs.forEach(doc => {
                const data = doc.data()
                if (data.title.toLowerCase().includes(searchLower) ||
                    (data.description && data.description.toLowerCase().includes(searchLower))) {
                    allResults.push({
                        id: doc.id,
                        type: "playbook",
                        title: data.title,
                        description: data.description,
                    })
                }
            })

            setResults(allResults)
        } catch (error) {
            console.error("Error searching:", error)
        } finally {
            setLoading(false)
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "prompt": return MessageSquareText
            case "tweet": return Twitter
            case "tool": return Wrench
            case "playbook": return BookOpen
            default: return MessageSquareText
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "prompt": return "بروبمت"
            case "tweet": return "تغريدة"
            case "tool": return "أداة"
            case "playbook": return "Playbook"
            default: return type
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case "prompt": return "bg-indigo-100 text-indigo-700"
            case "tweet": return "bg-cyan-100 text-cyan-700"
            case "tool": return "bg-emerald-100 text-emerald-700"
            case "playbook": return "bg-orange-100 text-orange-700"
            default: return "bg-gray-100 text-gray-700"
        }
    }

    const getTypeHref = (type: string, id: string) => {
        switch (type) {
            case "prompt": return `/dashboard/prompts/${id}`
            case "tweet": return `/dashboard/tweets`
            case "tool": return `/dashboard/tools`
            case "playbook": return `/dashboard/playbooks/${id}`
            default: return "/dashboard"
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    البحث الشامل
                </h1>
                <p className="text-slate-500">ابحث في جميع محتوياتك</p>
            </div>

            {/* Search Input */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="ابحث في البروبمتات، التغريدات، الأدوات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white py-3 pr-10 pl-4 text-lg transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900"
                />
            </div>

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            ) : hasSearched ? (
                results.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Search className="mx-auto h-12 w-12 text-slate-300" />
                            <h3 className="mt-4 font-medium text-slate-900 dark:text-white">
                                لا توجد نتائج
                            </h3>
                            <p className="mt-1 text-slate-500">
                                جرب كلمات بحث مختلفة
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-500">
                            {results.length} نتيجة
                        </p>
                        {results.map((result) => {
                            const Icon = getTypeIcon(result.type)
                            return (
                                <Link
                                    key={`${result.type}-${result.id}`}
                                    href={getTypeHref(result.type, result.id)}
                                >
                                    <Card hover className="cursor-pointer">
                                        <CardContent className="flex items-center gap-4">
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getTypeColor(result.type)}`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-slate-900 dark:text-white">
                                                    {result.title}
                                                </h3>
                                                {result.description && (
                                                    <p className="text-sm text-slate-500 line-clamp-1">
                                                        {result.description}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge className={getTypeColor(result.type)}>
                                                {getTypeLabel(result.type)}
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                </Link>
                            )
                        })}
                    </div>
                )
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Search className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-4 font-medium text-slate-900 dark:text-white">
                            ابدأ البحث
                        </h3>
                        <p className="mt-1 text-slate-500">
                            اكتب كلمة البحث واضغط Enter
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
