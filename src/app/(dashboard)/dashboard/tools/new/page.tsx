"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore"
import { Button, Input, Textarea, Card, CardContent, Select } from "@/components/ui"
import { ArrowRight, Save } from "lucide-react"
import Link from "next/link"

interface Category {
    id: string
    name: string
}

export default function NewToolPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { userData } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [form, setForm] = useState({
        name: "",
        description: "",
        officialUrl: "",
        categoryId: searchParams.get("categoryId") || "",
        notes: "",
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
            const toolId = doc(collection(db, "tools")).id

            await setDoc(doc(db, "tools", toolId), {
                id: toolId,
                workspaceId: userData.workspaceId,
                name: form.name,
                description: form.description || null,
                officialUrl: form.officialUrl || null,
                categoryId: form.categoryId || null,
                notes: form.notes || null,
                isArchived: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            router.push("/dashboard/tools")
        } catch (error) {
            console.error("Failed to create tool:", error)
            alert("حدث خطأ")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/tools">
                    <Button variant="ghost" size="icon">
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        إضافة أداة جديدة
                    </h1>
                    <p className="text-slate-500">أضف أداة ذكاء اصطناعي لمكتبتك</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardContent className="space-y-5">
                        <Input
                            label="اسم الأداة"
                            placeholder="مثال: ChatGPT"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />

                        <Textarea
                            label="وصف الأداة"
                            placeholder="ما هي هذه الأداة وماذا تفعل؟"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="min-h-[100px]"
                        />

                        <Input
                            label="الرابط"
                            placeholder="https://..."
                            value={form.officialUrl}
                            onChange={(e) => setForm({ ...form, officialUrl: e.target.value })}
                        />

                        <Select
                            label="التصنيف"
                            placeholder="اختر تصنيفًا"
                            value={form.categoryId}
                            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                            options={categories.map((c) => ({ value: c.id, label: c.name }))}
                        />

                        <Textarea
                            label="ملاحظات (اختياري)"
                            placeholder="ملاحظات إضافية عن الأداة..."
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="min-h-[80px]"
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/dashboard/tools">
                        <Button variant="outline" type="button">
                            إلغاء
                        </Button>
                    </Link>
                    <Button type="submit" isLoading={isLoading}>
                        <Save className="h-4 w-4" />
                        حفظ الأداة
                    </Button>
                </div>
            </form>
        </div>
    )
}
