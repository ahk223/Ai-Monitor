"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { Card, CardContent, Button, Badge } from "@/components/ui"
import {
    Plus,
    Search,
    Twitter,
    ExternalLink,
    Edit2,
    Trash2,
    Loader2,
} from "lucide-react"
import Link from "next/link"

interface Tweet {
    id: string
    content: string
    sourceUrl: string | null
    importance: string | null
    categoryId: string | null
    createdAt: Date
    isArchived: boolean
}

interface Category {
    id: string
    name: string
    color: string
}

export default function TweetsPage() {
    const { userData } = useAuth()
    const [tweets, setTweets] = useState<Tweet[]>([])
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

            // Fetch tweets
            const tweetsQuery = query(
                collection(db, "tweets"),
                where("workspaceId", "==", userData.workspaceId),
                where("isArchived", "==", false)
            )
            const tweetsSnap = await getDocs(tweetsQuery)
            const tweetsList = tweetsSnap.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            })) as Tweet[]

            tweetsList.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
                const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
                return dateB.getTime() - dateA.getTime()
            })

            setTweets(tweetsList)
        } catch (error) {
            console.error("Error fetching tweets:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه التغريدة؟")) return

        try {
            await updateDoc(doc(db, "tweets", id), { isArchived: true })
            setTweets(tweets.filter(t => t.id !== id))
        } catch (error) {
            console.error("Error deleting tweet:", error)
        }
    }

    const getCategoryById = (id: string | null) => {
        if (!id) return null
        return categories.find(c => c.id === id)
    }

    const filteredTweets = tweets.filter(tweet => {
        return !search || tweet.content.toLowerCase().includes(search.toLowerCase())
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
                        التغريدات والملاحظات
                    </h1>
                    <p className="text-slate-500">{tweets.length} تغريدة في مكتبتك</p>
                </div>
                <Link href="/dashboard/tweets/new">
                    <Button>
                        <Plus className="h-4 w-4" />
                        إضافة تغريدة
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="ابحث في التغريدات..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 pr-10 pl-4 transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900"
                />
            </div>

            {/* Tweets Grid */}
            {filteredTweets.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Twitter className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-4 font-medium text-slate-900 dark:text-white">
                            لا توجد تغريدات
                        </h3>
                        <p className="mt-1 text-slate-500">
                            ابدأ بإضافة أول تغريدة
                        </p>
                        <Link href="/dashboard/tweets/new" className="mt-4 inline-block">
                            <Button>
                                <Plus className="h-4 w-4" />
                                إضافة تغريدة
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTweets.map(tweet => {
                        const category = getCategoryById(tweet.categoryId)
                        return (
                            <Card key={tweet.id} hover className="group">
                                <CardContent>
                                    <p className="line-clamp-4 text-slate-700 dark:text-slate-300">
                                        {tweet.content}
                                    </p>

                                    {tweet.importance && (
                                        <p className="mt-2 text-sm text-slate-500">
                                            <strong>الأهمية:</strong> {tweet.importance}
                                        </p>
                                    )}

                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {category && (
                                                <Badge style={{ backgroundColor: category.color + "20", color: category.color }}>
                                                    {category.name}
                                                </Badge>
                                            )}
                                            {tweet.sourceUrl && (
                                                <a
                                                    href={tweet.sourceUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-slate-400 hover:text-indigo-600"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleDelete(tweet.id)}
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
