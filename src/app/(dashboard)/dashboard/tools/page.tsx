"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, Button, Badge } from "@/components/ui"
import { Plus, Search, Wrench, ExternalLink, Trash2, GraduationCap } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

interface Tool {
    id: string
    name: string
    description: string | null
    officialUrl: string | null
    createdAt: string
    category: { name: string; color: string } | null
    masteryLevel: { name: string } | null
    tags: { id: string; name: string }[]
    _count: { lessons: number; learningPaths: number }
}

export default function ToolsPage() {
    const [tools, setTools] = useState<Tool[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        fetchTools()
    }, [search])

    const fetchTools = async () => {
        try {
            const params = new URLSearchParams()
            if (search) params.set("search", search)
            const res = await fetch(`/api/tools?${params}`)
            const data = await res.json()
            setTools(data)
        } catch (error) {
            console.error("Failed to fetch tools:", error)
        } finally {
            setLoading(false)
        }
    }

    const deleteTool = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه الأداة؟")) return
        try {
            await fetch(`/api/tools/${id}`, { method: "DELETE" })
            setTools(tools.filter((t) => t.id !== id))
        } catch (error) {
            console.error("Failed to delete tool:", error)
        }
    }

    const getMasteryColor = (level: string) => {
        switch (level) {
            case "لم أبدأ": return "bg-slate-100 text-slate-600"
            case "أتعلم": return "bg-amber-100 text-amber-700"
            case "أستخدمها": return "bg-emerald-100 text-emerald-700"
            case "محترف": return "bg-purple-100 text-purple-700"
            default: return "bg-slate-100 text-slate-600"
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">الأدوات</h1>
                    <p className="text-slate-500">إدارة أدوات الذكاء الاصطناعي ومسارات التعلم</p>
                </div>
                <Link href="/dashboard/tools/new">
                    <Button>
                        <Plus className="h-4 w-4" />
                        أداة جديدة
                    </Button>
                </Link>
            </div>

            <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="ابحث في الأدوات..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-11 w-full rounded-xl border-2 border-slate-200 bg-white pr-10 pl-4 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900"
                />
            </div>

            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent>
                                <div className="h-5 w-1/2 rounded bg-slate-200" />
                                <div className="mt-2 h-3 w-3/4 rounded bg-slate-100" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : tools.length === 0 ? (
                <Card className="py-12">
                    <CardContent className="text-center">
                        <Wrench className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-4 text-lg font-medium">لا توجد أدوات</h3>
                        <p className="mt-1 text-slate-500">ابدأ بإضافة أول أداة</p>
                        <Link href="/dashboard/tools/new" className="mt-4 inline-block">
                            <Button><Plus className="h-4 w-4" /> إضافة أداة</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tools.map((tool) => (
                        <Card key={tool.id} hover className="group">
                            <CardContent>
                                <div className="flex items-start justify-between">
                                    <Link href={`/dashboard/tools/${tool.id}`} className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white">
                                            {tool.name}
                                        </h3>
                                    </Link>
                                    <div className="flex gap-1">
                                        {tool.officialUrl && (
                                            <a
                                                href={tool.officialUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => deleteTool(tool.id)}
                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {tool.description && (
                                    <p className="mt-2 text-sm text-slate-500 line-clamp-2">{tool.description}</p>
                                )}

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {tool.masteryLevel && (
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getMasteryColor(tool.masteryLevel.name)}`}>
                                            {tool.masteryLevel.name}
                                        </span>
                                    )}
                                    {tool.category && (
                                        <Badge style={{ backgroundColor: tool.category.color + "20", color: tool.category.color }}>
                                            {tool.category.name}
                                        </Badge>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <GraduationCap className="h-3.5 w-3.5" />
                                        {tool._count.lessons} درس
                                    </span>
                                    <span>{formatRelativeTime(tool.createdAt)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
