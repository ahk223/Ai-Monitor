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
    Trash2,
    Loader2,
    Youtube,
    Instagram,
    Video,
    Share2
} from "lucide-react"
import Link from "next/link"

interface Tweet {
    id: string
    content: string
    sourceUrl: string | null
    importance: string | null
    categoryId: string | null
    platform?: string
    createdAt: Date
    isArchived: boolean
}

interface Category {
    id: string
    name: string
    color: string
}

export default function SocialMediaPage() {
    const { userData } = useAuth()
    const [items, setItems] = useState<Tweet[]>([])
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

            // Fetch tweets (now social media items)
            const itemsQuery = query(
                collection(db, "tweets"),
                where("workspaceId", "==", userData.workspaceId),
                where("isArchived", "==", false)
            )
            const itemsSnap = await getDocs(itemsQuery)
            const itemsList = itemsSnap.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            })) as Tweet[]

            itemsList.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
                const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
                return dateB.getTime() - dateA.getTime()
            })

            setItems(itemsList)
        } catch (error) {
            console.error("Error fetching items:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا المحتوى؟")) return

        try {
            await updateDoc(doc(db, "tweets", id), { isArchived: true })
            setItems(items.filter(t => t.id !== id))
        } catch (error) {
            console.error("Error deleting item:", error)
        }
    }

    const getCategoryById = (id: string | null) => {
        if (!id) return null
        return categories.find(c => c.id === id)
    }

    const getPlatformIcon = (platform?: string) => {
        switch (platform?.toLowerCase()) {
            case 'x':
            case 'twitter':
                return <Twitter className="h-4 w-4 text-sky-500" />
            case 'youtube':
                return <Youtube className="h-4 w-4 text-red-500" />
            case 'instagram':
                return <Instagram className="h-4 w-4 text-pink-500" />
            case 'tiktok':
                return <Video className="h-4 w-4 text-slate-900 dark:text-white" />
            default:
                return <Share2 className="h-4 w-4 text-slate-500" />
        }
    }

    const filteredItems = items.filter(item => {
        return !search || item.content.toLowerCase().includes(search.toLowerCase())
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
                        محتوى السوشيال ميديا
                    </h1>
                    <p className="text-slate-500">{items.length} عنصر في مكتبتك</p>
                </div>
                <Link href="/dashboard/tweets/new">
                    <Button>
                        <Plus className="h-4 w-4" />
                        إضافة محتوى
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="ابحث في المحتوى..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 pr-10 pl-4 transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900"
                />
            </div>

            {/* Items Grid */}
            {filteredItems.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Share2 className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-4 font-medium text-slate-900 dark:text-white">
                            لا يوجد محتوى
                        </h3>
                        <p className="mt-1 text-slate-500">
                            ابدأ بإضافة أول محتوى سوشيال ميديا
                        </p>
                        <Link href="/dashboard/tweets/new" className="mt-4 inline-block">
                            <Button>
                                <Plus className="h-4 w-4" />
                                إضافة محتوى
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredItems.map(item => {
                        const category = getCategoryById(item.categoryId)
                        return (
                            <Card key={item.id} hover className="group">
                                <CardContent>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2" title={item.platform || 'Other'}>
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                                {getPlatformIcon(item.platform)}
                                            </div>
                                            {category && (
                                                <Badge style={{ backgroundColor: category.color + "20", color: category.color }}>
                                                    {category.name}
                                                </Badge>
                                            )}
                                        </div>
                                        {item.sourceUrl && (
                                            <a
                                                href={item.sourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-slate-400 hover:text-indigo-600"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        )}
                                    </div>

                                    <p className="line-clamp-4 text-slate-700 dark:text-slate-300 min-h-[5rem]">
                                        {item.content || item.sourceUrl}
                                    </p>

                                    <div className="mt-4 flex items-center justify-between border-t pt-3 dark:border-slate-800">
                                        {item.importance ? (
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                {item.importance}
                                            </span>
                                        ) : <span></span>}

                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                            title="حذف"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
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
