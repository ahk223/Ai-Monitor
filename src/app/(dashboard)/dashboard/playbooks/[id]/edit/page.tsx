"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { Button, Input, Textarea, Card, CardContent, Select } from "@/components/ui"
import { ArrowRight, Save, BookOpen, Loader2 } from "lucide-react"
import Link from "next/link"

interface Category {
    id: string
    name: string
}

export default function EditPlaybookPage() {
    const router = useRouter()
    const params = useParams()
    const playbookId = params.id as string
    const { userData } = useAuth()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [form, setForm] = useState({
        title: "",
        description: "",
        toolUrl: "",
        categoryId: "",
    })

    useEffect(() => {
        if (userData?.workspaceId && playbookId) {
            fetchData()
        }
    }, [userData?.workspaceId, playbookId])

    const fetchData = async () => {
        if (!userData?.workspaceId) return

        try {
            // Fetch playbook
            const playbookDoc = await getDoc(doc(db, "playbooks", playbookId))
            if (playbookDoc.exists()) {
                const data = playbookDoc.data()
                setForm({
                    title: data.title || "",
                    description: data.description || "",
                    toolUrl: data.toolUrl || "",
                    categoryId: data.categoryId || "",
                })
            } else {
                router.push("/dashboard/playbooks")
                return
            }

            // Fetch categories
            const q = query(
                collection(db, "categories"),
                where("workspaceId", "==", userData.workspaceId)
            )
            const snap = await getDocs(q)
            setCategories(snap.docs.map(d => ({ id: d.id, name: d.data().name })))
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title || !userData?.workspaceId) return

        setIsSaving(true)
        try {
            await updateDoc(doc(db, "playbooks", playbookId), {
                title: form.title,
                description: form.description,
                toolUrl: form.toolUrl,
                categoryId: form.categoryId,
                updatedAt: new Date(),
            })
            router.push("/dashboard/playbooks")
        } catch (error) {
            console.error("Error updating playbook:", error)
            alert("حدث خطأ أثناء تحديث الـ Playbook")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/playbooks">
                    <Button variant="ghost" size="icon">
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="h-7 w-7 text-orange-600" />
                        تعديل Playbook
                    </h1>
                    <p className="text-slate-500 mt-1">تعديل بيانات الـ Playbook</p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="عنوان الـ Playbook"
                            placeholder="مثال: خطوات تعلم React"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            required
                            autoComplete="off"
                            name="edit_playbook_title"
                        />

                        <Input
                            label="رابط الأداة (اختياري)"
                            placeholder="https://..."
                            value={form.toolUrl}
                            onChange={(e) => setForm({ ...form, toolUrl: e.target.value })}
                            dir="ltr"
                            autoComplete="off"
                            name="edit_playbook_url"
                        />

                        <Select
                            label="التصنيف"
                            value={form.categoryId}
                            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                            options={[
                                { value: "", label: "بدون تصنيف" },
                                ...categories.map(c => ({ value: c.id, label: c.name }))
                            ]}
                        />

                        <Textarea
                            label="الوصف"
                            placeholder="وصف مختصر للـ Playbook..."
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={4}
                        />

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <Link href="/dashboard/playbooks">
                                <Button type="button" variant="outline">
                                    إلغاء
                                </Button>
                            </Link>
                            <Button type="submit" isLoading={isSaving}>
                                <Save className="h-4 w-4 ml-2" />
                                حفظ التعديلات
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
