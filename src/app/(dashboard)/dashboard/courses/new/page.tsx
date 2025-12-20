"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore"
import { Button, Input, Textarea, Card, CardContent, Select } from "@/components/ui"
import { ArrowRight, Save, GraduationCap } from "lucide-react"
import Link from "next/link"

interface Category {
    id: string
    name: string
}

export default function NewCoursePage() {
    const router = useRouter()
    const { userData } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [form, setForm] = useState({
        title: "",
        url: "",
        tool: "",
        notes: "",
        categoryId: "",
    })

    useEffect(() => {
        document.title = "إضافة كورس جديد | AI Knowledge Hub"
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
            const docId = doc(collection(db, "courses")).id

            await setDoc(doc(db, "courses", docId), {
                id: docId,
                workspaceId: userData.workspaceId,
                title: form.title,
                url: form.url,
                tool: form.tool,
                notes: form.notes,
                categoryId: form.categoryId || null,
                createdAt: new Date(),
                updatedAt: new Date(),
                type: 'course' // Consistency for eventual aggregation
            })

            router.push("/dashboard/courses")
        } catch (error) {
            console.error("Error adding course:", error)
            alert("حدث خطأ أثناء الإضافة")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/courses">
                    <Button variant="outline" size="icon" className="h-10 w-10">
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        إضافة كورس جديد
                    </h1>
                    <p className="text-slate-500">
                        أضف كورس تعليمي جديد للمكتبة
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900 dark:text-white">
                                اسم الكورس <span className="text-red-500">*</span>
                            </label>
                            <Input
                                required
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="مثلاً: دورة تعلم React المتقدمة"
                            />
                        </div>

                        {/* URL */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900 dark:text-white">
                                رابط الكورس <span className="text-red-500">*</span>
                            </label>
                            <Input
                                required
                                type="url"
                                value={form.url}
                                onChange={e => setForm({ ...form, url: e.target.value })}
                                placeholder="https://..."
                                dir="ltr"
                            />
                        </div>

                        {/* Tool */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900 dark:text-white">
                                الأداة المستخدمة (اختياري)
                            </label>
                            <Input
                                value={form.tool}
                                onChange={e => setForm({ ...form, tool: e.target.value })}
                                placeholder="مثلاً: Cursor, V0, ChatGPT"
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900 dark:text-white">
                                التصنيف
                            </label>
                            <Select
                                value={form.categoryId}
                                onChange={e => setForm({ ...form, categoryId: e.target.value })}
                                options={[
                                    { value: "", label: "اختر التصنيف..." },
                                    ...categories.map(c => ({ value: c.id, label: c.name }))
                                ]}
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900 dark:text-white">
                                ملاحظات
                            </label>
                            <Textarea
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                                placeholder="أي ملاحظات إضافية عن الكورس..."
                                rows={4}
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
                                isLoading={isLoading}
                            >
                                <Save className="h-4 w-4 ml-2" />
                                حفظ الكورس
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
