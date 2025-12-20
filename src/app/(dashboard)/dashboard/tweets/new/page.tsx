"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore"
import { Button, Input, Textarea, Card, CardContent, Select } from "@/components/ui"
import { ArrowRight, Save, Twitter } from "lucide-react"
import Link from "next/link"

interface Category {
    id: string
    name: string
}

export default function NewTweetPage() {
    const router = useRouter()
    const { userData } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [form, setForm] = useState({
        content: "",
        authorHandle: "",
        authorName: "",
        importance: "",
        categoryId: "",
        tweetUrl: "",
    })

    useEffect(() => {
        if (userData?.workspaceId) {
            fetchCategories()
        }
    }, [userData?.workspaceId])

    const fetchCategories = async () => {
        if (!userData?.workspaceId) return

        try {
            const categoriesQuery = query(
                collection(db, "categories"),
                where("workspaceId", "==", userData.workspaceId)
            )
            const snap = await getDocs(categoriesQuery)
            const cats = snap.docs.map(doc => doc.data() as Category)
            setCategories(cats)
        } catch (error) {
            console.error("Error fetching categories:", error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userData?.workspaceId) return

        setIsLoading(true)

        try {
            const tweetId = doc(collection(db, "tweets")).id

            await setDoc(doc(db, "tweets", tweetId), {
                id: tweetId,
                workspaceId: userData.workspaceId,
                content: form.content,
                authorHandle: form.authorHandle || null,
                authorName: form.authorName || null,
                importance: form.importance || null,
                categoryId: form.categoryId || null,
                tweetUrl: form.tweetUrl || null,
                isArchived: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            router.push("/dashboard/tweets")
        } catch (error) {
            console.error("Failed to create tweet:", error)
            alert("حدث خطأ")
        } finally {
            setIsLoading(false)
        }
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
                        إضافة تغريدة جديدة
                    </h1>
                    <p className="text-slate-500">احفظ تغريدة مهمة للرجوع إليها لاحقاً</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardContent className="space-y-5">
                        <Textarea
                            label="محتوى التغريدة"
                            placeholder="نص التغريدة..."
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                            className="min-h-[150px]"
                            required
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="اسم الحساب"
                                placeholder="@username"
                                value={form.authorHandle}
                                onChange={(e) => setForm({ ...form, authorHandle: e.target.value })}
                            />
                            <Input
                                label="اسم المستخدم"
                                placeholder="الاسم الظاهر"
                                value={form.authorName}
                                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                            />
                        </div>

                        <Input
                            label="رابط التغريدة (اختياري)"
                            placeholder="https://twitter.com/..."
                            value={form.tweetUrl}
                            onChange={(e) => setForm({ ...form, tweetUrl: e.target.value })}
                        />

                        <Textarea
                            label="أهمية التغريدة"
                            placeholder="لماذا هذه التغريدة مهمة؟"
                            value={form.importance}
                            onChange={(e) => setForm({ ...form, importance: e.target.value })}
                            className="min-h-[80px]"
                        />

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
                        حفظ التغريدة
                    </Button>
                </div>
            </form>
        </div>
    )
}
