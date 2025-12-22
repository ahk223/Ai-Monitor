"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, doc, getDoc, updateDoc, getDocs, query, where } from "firebase/firestore"
import { Button, Input, Textarea, Card, CardContent, Select } from "@/components/ui"
import { ArrowRight, Save, Loader2 } from "lucide-react"
import Link from "next/link"

interface Category {
    id: string
    name: string
}

const PLATFORMS = [
    { value: 'x', label: 'X (Twitter)' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'other', label: 'منصة أخرى' },
]

export default function EditSocialMediaPage() {
    const router = useRouter()
    const params = useParams()
    const itemId = params.id as string
    const { userData } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [loading, setLoading] = useState(true)
    const [categories, setCategories] = useState<Category[]>([])
    const [form, setForm] = useState({
        url: "",
        platform: "x",
        importance: "",
        categoryId: "",
    })

    useEffect(() => {
        if (userData?.workspaceId && itemId) {
            fetchData()
        }
    }, [userData?.workspaceId, itemId])

    const fetchData = async () => {
        if (!userData?.workspaceId) return

        try {
            // Fetch item data
            const itemDoc = await getDoc(doc(db, "tweets", itemId))
            if (itemDoc.exists()) {
                const data = itemDoc.data()
                setForm({
                    url: data.sourceUrl || "",
                    platform: data.platform || "x",
                    importance: data.importance || "",
                    categoryId: data.categoryId || "",
                })
            }

            // Fetch categories
            const categoriesQuery = query(
                collection(db, "categories"),
                where("workspaceId", "==", userData.workspaceId)
            )
            const snap = await getDocs(categoriesQuery)
            const cats = snap.docs.map(doc => doc.data() as Category)
            setCategories(cats)
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userData?.workspaceId) return

        setIsLoading(true)

        try {
            await updateDoc(doc(db, "tweets", itemId), {
                sourceUrl: form.url,
                platform: form.platform,
                importance: form.importance || null,
                categoryId: form.categoryId || null,
                updatedAt: new Date(),
            })

            router.push("/dashboard/tweets")
        } catch (error) {
            console.error("Failed to update item:", error)
            alert("حدث خطأ")
        } finally {
            setIsLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/tweets">
                    <Button variant="ghost" size="icon">
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        تعديل المحتوى
                    </h1>
                    <p className="text-slate-500">تعديل بيانات محتوى السوشيال ميديا</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardContent className="space-y-5">
                        {/* URL */}
                        <Input
                            label="رابط المحتوى"
                            placeholder="انسخ الرابط هنا..."
                            value={form.url}
                            onChange={(e) => setForm({ ...form, url: e.target.value })}
                            required
                        />

                        {/* Platform Select */}
                        <Select
                            label="المنصة"
                            placeholder="اختر المنصة"
                            value={form.platform}
                            onChange={(e) => setForm({ ...form, platform: e.target.value })}
                            options={PLATFORMS}
                        />

                        {/* Importance */}
                        <Textarea
                            label="ملاحظات / سبب الحفظ"
                            placeholder="لماذا هذا المحتوى مهم؟"
                            value={form.importance}
                            onChange={(e) => setForm({ ...form, importance: e.target.value })}
                            className="min-h-[100px]"
                            required
                        />

                        {/* Category */}
                        <Select
                            label="التصنيف"
                            placeholder="اختر تصنيفًا"
                            value={form.categoryId}
                            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                            options={categories.map((c) => ({ value: c.id, label: c.name }))}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/dashboard/tweets">
                        <Button variant="outline" type="button">
                            إلغاء
                        </Button>
                    </Link>
                    <Button type="submit" isLoading={isLoading}>
                        <Save className="h-4 w-4" />
                        حفظ التعديلات
                    </Button>
                </div>
            </form>
        </div>
    )
}
