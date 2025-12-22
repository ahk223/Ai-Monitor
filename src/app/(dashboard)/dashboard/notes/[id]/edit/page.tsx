"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore"
import { Card, CardContent, Button, Textarea, Select, Input } from "@/components/ui"
import { ArrowRight, Save, Loader2 } from "lucide-react"
import Link from "next/link"

interface Category {
    id: string
    name: string
    color: string
}

export default function EditNotePage() {
    const router = useRouter()
    const params = useParams()
    const noteId = params.id as string
    const { userData } = useAuth()
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [categoryId, setCategoryId] = useState("")
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (userData?.workspaceId && noteId) {
            fetchData()
        }
    }, [userData, noteId])

    const fetchData = async () => {
        try {
            // Fetch note data
            const noteDoc = await getDoc(doc(db, "notes", noteId))
            if (noteDoc.exists()) {
                const noteData = noteDoc.data()
                setTitle(noteData.title || "")
                setContent(noteData.content || "")
                setCategoryId(noteData.categoryId || "")
            }

            // Fetch categories
            const catsQuery = query(
                collection(db, "categories"),
                where("workspaceId", "==", userData?.workspaceId)
            )
            const catsSnap = await getDocs(catsQuery)
            setCategories(catsSnap.docs.map(doc => doc.data() as Category))
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !content.trim() || !userData?.workspaceId) return

        setSaving(true)
        try {
            await updateDoc(doc(db, "notes", noteId), {
                title: title.trim(),
                content: content.trim(),
                categoryId: categoryId || null,
                updatedAt: new Date(),
            })

            router.push("/dashboard/notes")
        } catch (error) {
            console.error("Error updating note:", error)
            alert("حدث خطأ أثناء الحفظ")
        } finally {
            setSaving(false)
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/notes">
                    <Button variant="ghost" size="icon">
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    تعديل الملاحظة
                </h1>
            </div>

            {/* Form */}
            <Card>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="عنوان الملاحظة"
                            placeholder="اكتب عنوان الملاحظة هنا..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />

                        <Textarea
                            label="محتوى الملاحظة"
                            placeholder="اكتب ملاحظتك هنا..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[200px]"
                            required
                        />

                        <Select
                            label="التصنيف (اختياري)"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            options={[
                                { value: "", label: "بدون تصنيف" },
                                ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                            ]}
                        />

                        <div className="flex justify-end gap-3">
                            <Link href="/dashboard/notes">
                                <Button variant="outline" type="button">
                                    إلغاء
                                </Button>
                            </Link>
                            <Button type="submit" isLoading={saving}>
                                <Save className="h-4 w-4" />
                                حفظ التعديلات
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
