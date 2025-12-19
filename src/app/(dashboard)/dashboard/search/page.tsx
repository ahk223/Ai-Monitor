"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, Badge } from "@/components/ui"
import { Search, MessageSquareText, Twitter, Wrench, BookOpen, Star } from "lucide-react"
import { truncate } from "@/lib/utils"

interface SearchResults {
    prompts: { id: string; title: string; description: string | null; rating: number | null; category: { name: string; color: string } | null }[]
    tweets: { id: string; content: string; benefitType: { name: string } | null; contentType: { name: string } | null }[]
    tools: { id: string; name: string; description: string | null; masteryLevel: { name: string } | null }[]
    playbooks: { id: string; title: string; description: string | null; _count: { steps: number } }[]
}

type FilterType = "all" | "prompts" | "tweets" | "tools" | "playbooks"

export default function SearchPage() {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResults | null>(null)
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState<FilterType>("all")

    useEffect(() => {
        if (query.length >= 2) {
            const timer = setTimeout(() => fetchResults(), 300)
            return () => clearTimeout(timer)
        } else {
            setResults(null)
        }
    }, [query, filter])

    const fetchResults = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${filter}`)
            const data = await res.json()
            setResults(data)
        } catch (error) {
            console.error("Search failed:", error)
        } finally {
            setLoading(false)
        }
    }

    const filters: { id: FilterType; label: string; icon: React.ElementType }[] = [
        { id: "all", label: "الكل", icon: Search },
        { id: "prompts", label: "البروبمتات", icon: MessageSquareText },
        { id: "tweets", label: "التغريدات", icon: Twitter },
        { id: "tools", label: "الأدوات", icon: Wrench },
        { id: "playbooks", label: "Playbooks", icon: BookOpen },
    ]

    const totalResults = results
        ? (results.prompts?.length || 0) + (results.tweets?.length || 0) + (results.tools?.length || 0) + (results.playbooks?.length || 0)
        : 0

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">البحث الشامل</h1>
                <p className="text-slate-500">ابحث في جميع محتوياتك</p>
            </div>

            {/* Search Input */}
            <div className="relative">
                <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="ابحث عن أي شيء..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-14 w-full rounded-2xl border-2 border-slate-200 bg-white pr-12 pl-4 text-lg outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900"
                    autoFocus
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {filters.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${filter === f.id
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                    >
                        <f.icon className="h-4 w-4" />
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Results */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                </div>
            ) : results ? (
                <div className="space-y-8">
                    {query.length >= 2 && (
                        <p className="text-sm text-slate-500">
                            عثرنا على {totalResults} نتيجة لـ &quot;{query}&quot;
                        </p>
                    )}

                    {/* Prompts */}
                    {results.prompts?.length > 0 && (filter === "all" || filter === "prompts") && (
                        <div>
                            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                                <MessageSquareText className="h-5 w-5 text-indigo-600" />
                                البروبمتات ({results.prompts.length})
                            </h2>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {results.prompts.map((prompt) => (
                                    <Link key={prompt.id} href={`/dashboard/prompts/${prompt.id}`}>
                                        <Card hover className="h-full">
                                            <CardContent>
                                                <h3 className="font-medium text-slate-900 dark:text-white">{prompt.title}</h3>
                                                {prompt.description && (
                                                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">{prompt.description}</p>
                                                )}
                                                <div className="mt-2 flex items-center gap-2">
                                                    {prompt.category && (
                                                        <Badge style={{ backgroundColor: prompt.category.color + "20", color: prompt.category.color }}>
                                                            {prompt.category.name}
                                                        </Badge>
                                                    )}
                                                    {prompt.rating && (
                                                        <span className="flex items-center gap-1 text-xs text-amber-500">
                                                            <Star className="h-3 w-3 fill-amber-500" />
                                                            {prompt.rating.toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tweets */}
                    {results.tweets?.length > 0 && (filter === "all" || filter === "tweets") && (
                        <div>
                            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                                <Twitter className="h-5 w-5 text-cyan-600" />
                                التغريدات ({results.tweets.length})
                            </h2>
                            <div className="space-y-3">
                                {results.tweets.map((tweet) => (
                                    <Card key={tweet.id} hover>
                                        <CardContent>
                                            <p className="text-slate-900 dark:text-white">{truncate(tweet.content, 200)}</p>
                                            <div className="mt-2 flex gap-2">
                                                {tweet.benefitType && <Badge variant="success">{tweet.benefitType.name}</Badge>}
                                                {tweet.contentType && <Badge variant="secondary">{tweet.contentType.name}</Badge>}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tools */}
                    {results.tools?.length > 0 && (filter === "all" || filter === "tools") && (
                        <div>
                            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                                <Wrench className="h-5 w-5 text-emerald-600" />
                                الأدوات ({results.tools.length})
                            </h2>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {results.tools.map((tool) => (
                                    <Link key={tool.id} href={`/dashboard/tools/${tool.id}`}>
                                        <Card hover className="h-full">
                                            <CardContent>
                                                <h3 className="font-medium text-slate-900 dark:text-white">{tool.name}</h3>
                                                {tool.description && (
                                                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">{tool.description}</p>
                                                )}
                                                {tool.masteryLevel && (
                                                    <Badge variant="secondary" className="mt-2">{tool.masteryLevel.name}</Badge>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Playbooks */}
                    {results.playbooks?.length > 0 && (filter === "all" || filter === "playbooks") && (
                        <div>
                            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                                <BookOpen className="h-5 w-5 text-orange-600" />
                                Playbooks ({results.playbooks.length})
                            </h2>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {results.playbooks.map((playbook) => (
                                    <Link key={playbook.id} href={`/dashboard/playbooks/${playbook.id}`}>
                                        <Card hover className="h-full">
                                            <CardContent>
                                                <h3 className="font-medium text-slate-900 dark:text-white">{playbook.title}</h3>
                                                {playbook.description && (
                                                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">{playbook.description}</p>
                                                )}
                                                <p className="mt-2 text-xs text-slate-400">{playbook._count.steps} خطوة</p>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {totalResults === 0 && query.length >= 2 && (
                        <div className="py-12 text-center">
                            <Search className="mx-auto h-12 w-12 text-slate-300" />
                            <p className="mt-4 text-slate-500">لم نجد نتائج لـ &quot;{query}&quot;</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="py-12 text-center text-slate-400">
                    <Search className="mx-auto h-16 w-16 opacity-50" />
                    <p className="mt-4">ابدأ بالكتابة للبحث</p>
                </div>
            )}
        </div>
    )
}
