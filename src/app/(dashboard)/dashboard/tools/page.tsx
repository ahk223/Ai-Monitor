"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { Card, CardContent, Button, Badge } from "@/components/ui"
import {
    Plus,
    Search,
    Wrench,
    ExternalLink,
    Trash2,
    Loader2,
    Star,
    Pencil,
    Heart,
} from "lucide-react"
import Link from "next/link"

interface Tool {
    id: string
    name: string
    description: string | null
    officialUrl: string | null
    rating: number | null
    categoryId: string | null
    createdAt: Date
    isArchived: boolean
    isFavorite?: boolean
}

interface Category {
    id: string
    name: string
    color: string
}

export default function ToolsPage() {
    const { userData } = useAuth()
    const [tools, setTools] = useState<Tool[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        if (userData?.workspaceId) {
            fetchData()
        }
    }, [userData?.workspaceId])

    const fetchData = async () => {
        if (!userData?.workspaceId) return

        try {
            // Fetch categories
            const categoriesQuery = query(
                collection(db, "categories"),
                where("workspaceId", "==", userData.workspaceId)
            )
            const categoriesSnap = await getDocs(categoriesQuery)
            const cats = categoriesSnap.docs.map(doc => doc.data() as Category)
            setCategories(cats)

            // Fetch tools
            const toolsQuery = query(
                collection(db, "tools"),
                where("workspaceId", "==", userData.workspaceId),
                where("isArchived", "==", false)
            )
            const toolsSnap = await getDocs(toolsQuery)
            const toolsList = toolsSnap.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            })) as Tool[]

            toolsList.sort((a, b) => {
                const aIsFavorite = a.isFavorite ?? false
                const bIsFavorite = b.isFavorite ?? false
                
                if (aIsFavorite && !bIsFavorite) return -1
                if (!aIsFavorite && bIsFavorite) return 1
                
                const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
                const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
                return dateB.getTime() - dateA.getTime()
            })

            setTools(toolsList)
        } catch (error) {
            console.error("Error fetching tools:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه الأداة؟")) return

        try {
            await updateDoc(doc(db, "tools", id), { isArchived: true })
            setTools(tools.filter(t => t.id !== id))
        } catch (error) {
            console.error("Error deleting tool:", error)
        }
    }

    const handleToggleFavorite = async (id: string) => {
        try {
            const tool = tools.find(t => t.id === id)
            if (!tool) return

            const newFavoriteStatus = !(tool.isFavorite ?? false)
            await updateDoc(doc(db, "tools", id), { isFavorite: newFavoriteStatus })
            
            setTools(prevTools => {
                const updated = prevTools.map(t => 
                    t.id === id ? { ...t, isFavorite: newFavoriteStatus } : t
                )
                updated.sort((a, b) => {
                    const aIsFavorite = a.isFavorite ?? false
                    const bIsFavorite = b.isFavorite ?? false
                    
                    if (aIsFavorite && !bIsFavorite) return -1
                    if (!aIsFavorite && bIsFavorite) return 1
                    
                    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
                    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
                    return dateB.getTime() - dateA.getTime()
                })
                return updated
            })
        } catch (error) {
            console.error("Error toggling favorite:", error)
        }
    }

    const getCategoryById = (id: string | null) => {
        if (!id) return null
        return categories.find(c => c.id === id)
    }

    // Function to convert URLs in text to clickable links
    const linkifyContent = (text: string) => {
        if (!text) return text
        const urlRegex = /(https?:\/\/[^\s]+)/g
        const parts = text.split(urlRegex)

        return parts.map((part, index) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline break-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                )
            }
            return part
        })
    }

    const filteredTools = tools.filter(tool => {
        return !search ||
            tool.name.toLowerCase().includes(search.toLowerCase()) ||
            (tool.description && tool.description.toLowerCase().includes(search.toLowerCase()))
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        الأدوات
                    </h1>
                    <p className="text-slate-500">{tools.length} أداة في مكتبتك</p>
                </div>
                <Link href="/dashboard/tools/new">
                    <Button>
                        <Plus className="h-4 w-4" />
                        إضافة أداة
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="ابحث في الأدوات..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 pr-10 pl-4 transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900"
                />
            </div>

            {/* Tools Grid */}
            {filteredTools.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Wrench className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-4 font-medium text-slate-900 dark:text-white">
                            لا توجد أدوات
                        </h3>
                        <p className="mt-1 text-slate-500">
                            ابدأ بإضافة أول أداة
                        </p>
                        <Link href="/dashboard/tools/new" className="mt-4 inline-block">
                            <Button>
                                <Plus className="h-4 w-4" />
                                إضافة أداة
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTools.map(tool => {
                        const category = getCategoryById(tool.categoryId)
                        return (
                            <Card key={tool.id} hover className="group relative">
                                <button
                                    onClick={() => handleToggleFavorite(tool.id)}
                                    className={`absolute top-2 left-2 rounded-lg p-1.5 transition-colors z-10 ${
                                        tool.isFavorite
                                            ? "text-red-500 hover:bg-red-50 hover:text-red-600 bg-white/90"
                                            : "text-slate-400 hover:bg-white/90 hover:text-slate-600 bg-white/70"
                                    }`}
                                    title={tool.isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                                >
                                    <Heart className={`h-4 w-4 ${tool.isFavorite ? "fill-red-500" : ""}`} />
                                </button>
                                <CardContent>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                                                <Wrench className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                                    {tool.name}
                                                </h3>
                                                {tool.rating && (
                                                    <div className="flex items-center gap-1 text-amber-500">
                                                        <Star className="h-4 w-4 fill-amber-500" />
                                                        <span className="text-sm">{tool.rating.toFixed(1)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {tool.description && (
                                        <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                                            {linkifyContent(tool.description)}
                                        </p>
                                    )}

                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {category && (
                                                <Badge style={{ backgroundColor: category.color + "20", color: category.color }}>
                                                    {category.name}
                                                </Badge>
                                            )}
                                            {tool.officialUrl && (
                                                <a
                                                    href={tool.officialUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-slate-400 hover:text-indigo-600"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Link href={`/dashboard/tools/${tool.id}/edit`}>
                                                <button
                                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30"
                                                    title="تعديل"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(tool.id)}
                                                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                                                title="حذف"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
