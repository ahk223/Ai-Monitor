"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, Button, Badge } from "@/components/ui"
import { Plus, Search, BookOpen, Trash2, ListChecks } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

interface Playbook {
    id: string
    title: string
    description: string | null
    usageCount: number
    createdAt: string
    tags: { id: string; name: string }[]
    _count: { steps: number }
}

export default function PlaybooksPage() {
    const [playbooks, setPlaybooks] = useState<Playbook[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        fetchPlaybooks()
    }, [search])

    const fetchPlaybooks = async () => {
        try {
            const params = new URLSearchParams()
            if (search) params.set("search", search)
            const res = await fetch(`/api/playbooks?${params}`)
            const data = await res.json()
            setPlaybooks(data)
        } catch (error) {
            console.error("Failed to fetch playbooks:", error)
        } finally {
            setLoading(false)
        }
    }

    const deletePlaybook = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الـPlaybook؟")) return
        try {
            await fetch(`/api/playbooks/${id}`, { method: "DELETE" })
            setPlaybooks(playbooks.filter((p) => p.id !== id))
        } catch (error) {
            console.error("Failed to delete playbook:", error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Playbooks</h1>
                    <p className="text-slate-500">وصفات عمل جاهزة للمهام المتكررة</p>
                </div>
                <Link href="/dashboard/playbooks/new">
                    <Button>
                        <Plus className="h-4 w-4" />
                        Playbook جديد
                    </Button>
                </Link>
            </div>

            <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="ابحث في الـPlaybooks..."
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
                                <div className="h-5 w-2/3 rounded bg-slate-200" />
                                <div className="mt-2 h-3 w-full rounded bg-slate-100" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : playbooks.length === 0 ? (
                <Card className="py-12">
                    <CardContent className="text-center">
                        <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-4 text-lg font-medium">لا توجد Playbooks</h3>
                        <p className="mt-1 text-slate-500">ابدأ بإنشاء أول Playbook</p>
                        <Link href="/dashboard/playbooks/new" className="mt-4 inline-block">
                            <Button><Plus className="h-4 w-4" /> إنشاء Playbook</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {playbooks.map((playbook) => (
                        <Card key={playbook.id} hover className="group">
                            <CardContent>
                                <div className="flex items-start justify-between">
                                    <Link href={`/dashboard/playbooks/${playbook.id}`} className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white">
                                            {playbook.title}
                                        </h3>
                                    </Link>
                                    <button
                                        onClick={() => deletePlaybook(playbook.id)}
                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                {playbook.description && (
                                    <p className="mt-2 text-sm text-slate-500 line-clamp-2">{playbook.description}</p>
                                )}

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {playbook.tags.map((tag) => (
                                        <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
                                    ))}
                                </div>

                                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <ListChecks className="h-3.5 w-3.5" />
                                        {playbook._count.steps} خطوة
                                    </span>
                                    <span>{formatRelativeTime(playbook.createdAt)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
