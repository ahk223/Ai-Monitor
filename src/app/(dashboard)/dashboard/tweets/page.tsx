"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, Button, Badge } from "@/components/ui"
import { Plus, Search, Twitter, ExternalLink, MoreVertical, Trash2 } from "lucide-react"
import { formatRelativeTime, truncate } from "@/lib/utils"

interface Tweet {
    id: string
    content: string
    sourceUrl: string | null
    importance: string | null
    createdAt: string
    category: { name: string; color: string } | null
    benefitType: { name: string } | null
    contentType: { name: string } | null
    tags: { id: string; name: string }[]
}

export default function TweetsPage() {
    const [tweets, setTweets] = useState<Tweet[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        fetchTweets()
    }, [search])

    const fetchTweets = async () => {
        try {
            const params = new URLSearchParams()
            if (search) params.set("search", search)
            const res = await fetch(`/api/tweets?${params}`)
            const data = await res.json()
            setTweets(data)
        } catch (error) {
            console.error("Failed to fetch tweets:", error)
        } finally {
            setLoading(false)
        }
    }

    const deleteTweet = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه التغريدة؟")) return
        try {
            await fetch(`/api/tweets/${id}`, { method: "DELETE" })
            setTweets(tweets.filter((t) => t.id !== id))
        } catch (error) {
            console.error("Failed to delete tweet:", error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">التغريدات والملاحظات</h1>
                    <p className="text-slate-500">حفظ وتنظيم المحتوى المفيد</p>
                </div>
                <Link href="/dashboard/tweets/new">
                    <Button>
                        <Plus className="h-4 w-4" />
                        تغريدة جديدة
                    </Button>
                </Link>
            </div>

            <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="ابحث في التغريدات..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-11 w-full rounded-xl border-2 border-slate-200 bg-white pr-10 pl-4 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900"
                />
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent>
                                <div className="h-4 w-3/4 rounded bg-slate-200" />
                                <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : tweets.length === 0 ? (
                <Card className="py-12">
                    <CardContent className="text-center">
                        <Twitter className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-4 text-lg font-medium">لا توجد تغريدات</h3>
                        <p className="mt-1 text-slate-500">ابدأ بإضافة أول تغريدة</p>
                        <Link href="/dashboard/tweets/new" className="mt-4 inline-block">
                            <Button><Plus className="h-4 w-4" /> إضافة تغريدة</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {tweets.map((tweet) => (
                        <Card key={tweet.id} hover className="group">
                            <CardContent>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-900 dark:text-white leading-relaxed">
                                            {tweet.content}
                                        </p>
                                        {tweet.importance && (
                                            <p className="mt-2 text-sm text-slate-500">
                                                <span className="font-medium">الأهمية:</span> {tweet.importance}
                                            </p>
                                        )}
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {tweet.benefitType && (
                                                <Badge variant="success">{tweet.benefitType.name}</Badge>
                                            )}
                                            {tweet.contentType && (
                                                <Badge variant="secondary">{tweet.contentType.name}</Badge>
                                            )}
                                            {tweet.tags.map((tag) => (
                                                <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {tweet.sourceUrl && (
                                            <a
                                                href={tweet.sourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => deleteTweet(tweet.id)}
                                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-slate-400">
                                    {formatRelativeTime(tweet.createdAt)}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
