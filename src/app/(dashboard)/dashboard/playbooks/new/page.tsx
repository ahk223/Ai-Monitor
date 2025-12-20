"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

export default function NewPlaybookPage() {
    const router = useRouter()
    const { userData } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [form, setForm] = useState({
        title: "",
        description: "",
        toolUrl: "",
        categoryId: "",
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

    // Generate a random share code
    const generateShareCode = () => {
        return Math.random().toString(36).substring(2, 10)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userData?.workspaceId) return

        setIsLoading(true)

        try {
            const playbookId = doc(collection(db, "playbooks")).id
            const shareCode = generateShareCode()

            await setDoc(doc(db, "playbooks", playbookId), {
                id: playbookId,
                workspaceId: userData.workspaceId,
                title: form.title,
                description: form.description || null,
                toolUrl: form.toolUrl || null,
                categoryId: form.categoryId || null,
                shareCode: shareCode,
                isPublic: false,
                isArchived: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            // Redirect to playbook detail to add items
            router.push(`/dashboard/playbooks/${playbookId}`)
        } catch (error) {
            console.error("Failed to create playbook:", error)
            alert("حدث خطأ")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/playbooks">
                    <Button variant="ghost" size="icon">
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        إنشاء Playbook جديد
                    </h1>
                    <p className="text-slate-500">أنشئ دليل تعليمي خطوة بخطوة</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardContent className="space-y-5">
                        <Input
                            label="اسم الـ Playbook"
                            placeholder="مثال: تعلم صناعة المحتوى بالذكاء الاصطناعي"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            required
                        />

                        <Textarea
                            label="الوصف"
                            placeholder="وش بتتعلم من هذا الـ Playbook؟"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="min-h-[100px]"
                            required
                        />

                        <Input
                            label="رابط الأداة (اختياري)"
                            placeholder="https://..."
                            value={form.toolUrl}
                            onChange={(e) => setForm({ ...form, toolUrl: e.target.value })}
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
                    <Link href="/dashboard/playbooks">
                        <Button variant="outline" type="button">
                            إلغاء
                        </Button>
                    </Link>
                    <Button type="submit" isLoading={isLoading}>
                        <Save className="h-4 w-4" />
                        إنشاء وإضافة المحتويات
                    </Button>
                </div>
            </form>
        </div>
    )
}
