"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { Card, CardContent, Button, Input, Badge } from "@/components/ui"
import {
    Plus,
    Search,
    Star,
    Copy,
    Edit2,
    Trash2,
    MessageSquareText,
    Filter,
    Loader2,
    Image as ImageIcon,
} from "lucide-react"
import Link from "next/link"
import { formatRelativeTime } from "@/lib/utils"

interface Prompt {
    id: string
    title: string
    description: string | null
    content: string
    rating: number | null
    categoryId: string | null
    createdAt: Date
    isArchived: boolean
}

interface Category {
    id: string
    name: string
    color: string
}

interface Attachment {
    id: string
    promptId: string
    url: string
    mimeType: string
}

export default function PromptsPage() {
    const { userData } = useAuth()
    const [prompts, setPrompts] = useState<Prompt[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({})
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("")

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

            // Fetch prompts
            const promptsQuery = query(
                collection(db, "prompts"),
                where("workspaceId", "==", userData.workspaceId),
                where("isArchived", "==", false)
            )
            const promptsSnap = await getDocs(promptsQuery)
            const promptsList = promptsSnap.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            })) as Prompt[]

            // Sort by createdAt
            promptsList.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
                const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
                return dateB.getTime() - dateA.getTime()
            })

            setPrompts(promptsList)

            // Fetch attachments for all prompts
            const promptIds = promptsList.map(p => p.id)
            if (promptIds.length > 0) {
                const attachmentsMap: Record<string, Attachment[]> = {}

                // Fetch all attachments (we'll filter client-side)
                const attachmentsQuery = query(collection(db, "attachments"))
                const attachmentsSnap = await getDocs(attachmentsQuery)

                attachmentsSnap.docs.forEach(doc => {
                    const data = doc.data() as Attachment
                    if (data.promptId && promptIds.includes(data.promptId)) {
                        if (!attachmentsMap[data.promptId]) {
                            attachmentsMap[data.promptId] = []
                        }
                        attachmentsMap[data.promptId].push(data)
                    }
                })

                setAttachments(attachmentsMap)
            }
        } catch (error) {
            console.error("Error fetching prompts:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = async (content: string) => {
        await navigator.clipboard.writeText(content)
        // TODO: Show toast
    }

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا البروبمت؟")) return

        try {
            await updateDoc(doc(db, "prompts", id), { isArchived: true })
            setPrompts(prompts.filter(p => p.id !== id))
        } catch (error) {
            console.error("Error deleting prompt:", error)
        }
    }

    const getCategoryById = (id: string | null) => {
        if (!id) return null
        return categories.find(c => c.id === id)
    }

    const getPromptImages = (promptId: string) => {
        const promptAttachments = attachments[promptId] || []
        return promptAttachments.filter(a => a.mimeType?.startsWith("image/"))
    }

    const filteredPrompts = prompts.filter(prompt => {
        const matchesSearch = !search ||
            prompt.title.toLowerCase().includes(search.toLowerCase()) ||
            prompt.content.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = !selectedCategory || prompt.categoryId === selectedCategory
        return matchesSearch && matchesCategory
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
                        البروبمتات
                    </h1>
                    <p className="text-slate-500">{prompts.length} بروبمت في مكتبتك</p>
                </div>
                <Link href="/dashboard/prompts/new">
                    <Button>
                        <Plus className="h-4 w-4" />
                        إضافة بروبمت
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="ابحث في البروبمتات..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 pr-10 pl-4 transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900"
                    />
                </div>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 transition-all focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                >
                    <option value="">كل التصنيفات</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* Prompts Grid */}
            {filteredPrompts.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <MessageSquareText className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-4 font-medium text-slate-900 dark:text-white">
                            لا توجد بروبمتات
                        </h3>
                        <p className="mt-1 text-slate-500">
                            {search || selectedCategory ? "جرب تغيير البحث أو الفلتر" : "ابدأ بإضافة أول بروبمت"}
                        </p>
                        {!search && !selectedCategory && (
                            <Link href="/dashboard/prompts/new" className="mt-4 inline-block">
                                <Button>
                                    <Plus className="h-4 w-4" />
                                    إضافة بروبمت
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredPrompts.map(prompt => {
                        const category = getCategoryById(prompt.categoryId)
                        const images = getPromptImages(prompt.id)
                        return (
                            <Card key={prompt.id} hover className="group overflow-hidden">
                                {/* Image Preview */}
                                {images.length > 0 && (
                                    <Link href={`/dashboard/prompts/${prompt.id}`}>
                                        <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 p-3">
                                            <img
                                                src={images[0].url}
                                                alt=""
                                                className="h-full w-full object-contain rounded-lg"
                                            />
                                            {images.length > 1 && (
                                                <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-xs text-white backdrop-blur-sm">
                                                    <ImageIcon className="h-3 w-3" />
                                                    +{images.length - 1}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                )}

                                <CardContent>
                                    <div className="flex items-start justify-between">
                                        <Link href={`/dashboard/prompts/${prompt.id}`} className="flex-1">
                                            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white">
                                                {prompt.title}
                                            </h3>
                                        </Link>
                                        {prompt.rating && (
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <Star className="h-4 w-4 fill-amber-500" />
                                                <span className="text-sm">{prompt.rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {prompt.description && (
                                        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                                            {prompt.description}
                                        </p>
                                    )}

                                    <p className="mt-2 line-clamp-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                                        {prompt.content}
                                    </p>

                                    <div className="mt-4 flex items-center justify-between">
                                        {category && (
                                            <Badge style={{ backgroundColor: category.color + "20", color: category.color }}>
                                                {category.name}
                                            </Badge>
                                        )}
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleCopy(prompt.content)}
                                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                                title="نسخ"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                            <Link href={`/dashboard/prompts/${prompt.id}/edit`}>
                                                <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="تعديل">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(prompt.id)}
                                                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
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
