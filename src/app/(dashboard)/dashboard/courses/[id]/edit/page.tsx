"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { Button, Input, Textarea, Card, CardContent, Select } from "@/components/ui"
import { ArrowRight, Save, GraduationCap, Loader2 } from "lucide-react"
import Link from "next/link"

interface Category {
    id: string
    name: string
}

export default function EditCoursePage() {
    const router = useRouter()
    const params = useParams()
    const courseId = params.id as string
    const { userData } = useAuth()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [form, setForm] = useState({
        name: "",
        url: "",
        tool: "",
        notes: "",
        categoryId: "",
    })

    useEffect(() => {
        if (userData?.workspaceId && courseId) {
            fetchData()
        }
    }, [userData?.workspaceId, courseId])

    const fetchData = async () => {
        if (!userData?.workspaceId) return

        try {
            // Fetch course
            const courseDoc = await getDoc(doc(db, "courses", courseId))
            if (courseDoc.exists()) {
                const data = courseDoc.data()
                setForm({
                    name: data.name || data.title || "",
                    url: data.url || "",
                    tool: data.tool || "",
                    notes: data.notes || "",
                    categoryId: data.categoryId || "",
                })
            } else {
                router.push("/dashboard/courses")
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
        if (!form.name || !form.url || !userData?.workspaceId) return

        setIsSaving(true)
        try {
            await updateDoc(doc(db, "courses", courseId), {
                name: form.name,
                url: form.url,
                tool: form.tool,
                notes: form.notes,
                categoryId: form.categoryId,
                updatedAt: new Date(),
            })
            router.push("/dashboard/courses")
        } catch (error) {
            console.error("Error updating course:", error)
            alert("حدث خطأ أثناء تحديث الكورس")
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
                <Link href="/dashboard/courses">
                    <Button variant="ghost" size="icon">
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="h-7 w-7 text-indigo-600" />
                        تعديل الكورس
                    </h1>
                    <p className="text-slate-500 mt-1">تعديل بيانات الكورس</p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="اسم الكورس"
                            placeholder="مثال: دورة React المتقدمة"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            autoComplete="off"
                            name="edit_course_name"
                        />

                        <Input
                            label="رابط الكورس"
                            placeholder="https://..."
                            value={form.url}
                            onChange={(e) => setForm({ ...form, url: e.target.value })}
                            required
                            dir="ltr"
                            autoComplete="off"
                            name="edit_course_url"
                        />

                        <Input
                            label="الأداة المستخدمة"
                            placeholder="مثلاً: Cursor, V0, ChatGPT"
                            value={form.tool}
                            onChange={(e) => setForm({ ...form, tool: e.target.value })}
                            autoComplete="off"
                            name="edit_course_tool"
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
                            label="ملاحظات"
                            placeholder="أي تفاصيل إضافية..."
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            rows={4}
                        />

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <Link href="/dashboard/courses">
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
