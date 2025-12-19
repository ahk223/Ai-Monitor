"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, Button, Input, Badge } from "@/components/ui"
import {
    Plus,
    Search,
    Filter,
    Star,
    Clock,
    FileText,
    MoreVertical,
    Copy,
    Trash2,
    Edit,
} from "lucide-react"
import { formatRelativeTime, truncate } from "@/lib/utils"

interface Prompt {
    id: string
    title: string
    description: string | null
    content: string
    rating: number | null
    usageCount: number
    createdAt: string
    category: { id: string; name: string; color: string } | null
    tags: { id: string; name: string }[]
    _count: { versions: number; tests: number }
}

export default function PromptsPage() {
    const [prompts, setPrompts] = useState<Prompt[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        fetchPrompts()
    }, [search])

    const fetchPrompts = async () => {
        try {
            const params = new URLSearchParams()
            if (search) params.set("search", search)

            const res = await fetch(`/api/prompts?${params}`)
            const data = await res.json()
            setPrompts(data)
        } catch (error) {
            console.error("Failed to fetch prompts:", error)
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = async (content: string) => {
        await navigator.clipboard.writeText(content)
        // Could add a toast notification here
    }

    const deletePrompt = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا البروبمت؟")) return

        try {
            await fetch(`/api/prompts/${id}`, { method: "DELETE" })
            setPrompts(prompts.filter((p) => p.id !== id))
        } catch (error) {
            console.error("Failed to delete prompt:", error)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        البروبمتات
                    </h1>
                    <p className="text-slate-500">إدارة مكتبة البروبمتات الخاصة بك</p>
                </div>

                <Link href="/dashboard/prompts/new">
                    <Button>
                        <Plus className="h-4 w-4" />
                        بروبمت جديد
                    </Button>
                </Link>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="ابحث في البروبمتات..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-11 w-full rounded-xl border-2 border-slate-200 bg-white pr-10 pl-4 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900"
                    />
                </div>

                <Button variant="outline">
                    <Filter className="h-4 w-4" />
                    فلترة
                </Button>
            </div>

            {/* Prompts Grid */}
            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent>
                                <div className="h-4 w-2/3 rounded bg-slate-200" />
                                <div className="mt-3 h-3 w-full rounded bg-slate-100" />
                                <div className="mt-1 h-3 w-3/4 rounded bg-slate-100" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : prompts.length === 0 ? (
                <Card className="py-12">
                    <CardContent className="text-center">
                        <FileText className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
                            لا توجد بروبمتات
                        </h3>
                        <p className="mt-1 text-slate-500">ابدأ بإضافة أول بروبمت لك</p>
                        <Link href="/dashboard/prompts/new" className="mt-4 inline-block">
                            <Button>
                                <Plus className="h-4 w-4" />
                                إضافة بروبمت
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {prompts.map((prompt) => (
                        <Card key={prompt.id} hover className="group">
                            <CardContent>
                                <div className="flex items-start justify-between">
                                    <Link
                                        href={`/dashboard/prompts/${prompt.id}`}
                                        className="flex-1 min-w-0"
                                    >
                                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white truncate">
                                            {prompt.title}
                                        </h3>
                                    </Link>

                                    <div className="relative">
                                        <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {prompt.description && (
                                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                                        {prompt.description}
                                    </p>
                                )}

                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {prompt.category && (
                                        <Badge
                                            variant="secondary"
                                            style={{ backgroundColor: prompt.category.color + "20", color: prompt.category.color }}
                                        >
                                            {prompt.category.name}
                                        </Badge>
                                    )}
                                    {prompt.tags.slice(0, 2).map((tag) => (
                                        <Badge key={tag.id} variant="secondary">
                                            {tag.name}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                                    <div className="flex items-center gap-3">
                                        {prompt.rating && (
                                            <span className="flex items-center gap-1 text-amber-500">
                                                <Star className="h-3.5 w-3.5 fill-amber-500" />
                                                {prompt.rating.toFixed(1)}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <FileText className="h-3.5 w-3.5" />
                                            v{prompt._count.versions}
                                        </span>
                                    </div>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        {formatRelativeTime(prompt.createdAt)}
                                    </span>
                                </div>

                                {/* Quick Actions */}
                                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => copyToClipboard(prompt.content)}
                                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                        نسخ
                                    </button>
                                    <Link
                                        href={`/dashboard/prompts/${prompt.id}/edit`}
                                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                    >
                                        <Edit className="h-3.5 w-3.5" />
                                        تعديل
                                    </Link>
                                    <button
                                        onClick={() => deletePrompt(prompt.id)}
                                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        حذف
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
