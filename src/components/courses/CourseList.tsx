"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from "firebase/firestore"
import { Button, Input, Textarea, Card, CardContent, Modal, Badge } from "@/components/ui"
import { Plus, Edit2, Trash2, ExternalLink, GraduationCap, Video, BookOpen, Clock } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface Course {
    id: string
    title: string
    url: string
    tool?: string
    notes?: string
    categoryId: string
    workspaceId: string
    createdAt: any
}

interface CourseListProps {
    categoryId: string
    categoryName: string
}

export function CourseList({ categoryId, categoryName }: CourseListProps) {
    const { userData } = useAuth()
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form state
    const [formData, setFormData] = useState<Partial<Course>>({
        title: "",
        url: "",
        tool: "",
        notes: ""
    })
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        if (userData?.workspaceId && categoryId) {
            fetchCourses()
        }
    }, [userData?.workspaceId, categoryId])

    const fetchCourses = async () => {
        try {
            const q = query(
                collection(db, "courses"),
                where("categoryId", "==", categoryId),
                where("workspaceId", "==", userData?.workspaceId),
                orderBy("createdAt", "desc")
            )
            const snap = await getDocs(q)
            setCourses(snap.docs.map(d => ({ ...d.data(), id: d.id } as Course)))
        } catch (error) {
            console.error("Error fetching courses:", error)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            title: "",
            url: "",
            tool: "",
            notes: ""
        })
        setEditingId(null)
    }

    const handleSave = async () => {
        if (!formData.title || !formData.url || !userData?.workspaceId) return

        setSaving(true)
        try {
            const courseData = {
                ...formData,
                categoryId,
                workspaceId: userData.workspaceId,
                updatedAt: new Date()
            }

            if (editingId) {
                await updateDoc(doc(db, "courses", editingId), courseData)
                setCourses(courses.map(c => c.id === editingId ? { ...c, ...courseData, id: editingId } as Course : c))
                setShowEditModal(false)
            } else {
                const docRef = await addDoc(collection(db, "courses"), {
                    ...courseData,
                    createdAt: new Date()
                })
                setCourses([{ ...courseData, id: docRef.id, createdAt: new Date() } as Course, ...courses])
                setShowAddModal(false)
            }
            resetForm()
        } catch (error) {
            console.error("Error saving course:", error)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الكورس؟")) return
        try {
            await deleteDoc(doc(db, "courses", id))
            setCourses(courses.filter(c => c.id !== id))
        } catch (error) {
            console.error("Error deleting course:", error)
        }
    }

    const openEdit = (course: Course) => {
        setFormData({
            title: course.title,
            url: course.url,
            tool: course.tool,
            notes: course.notes
        })
        setEditingId(course.id)
        setShowEditModal(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-indigo-600" />
                    كورسات {categoryName}
                </h3>
            </div>

            {loading ? (
                <div className="text-center py-10">جاري التحميل...</div>
            ) : courses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                    <GraduationCap className="mx-auto h-12 w-12 text-slate-300" />
                    <h3 className="mt-4 font-medium text-slate-900 dark:text-white">لا توجد كورسات</h3>
                    <p className="mt-1 text-slate-500">أضف كورسات تعليمية لهذا القسم</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map(course => (
                        <Card key={course.id} className="group overflow-hidden transition-all hover:shadow-md dark:hover:border-slate-700">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-slate-900 line-clamp-1 dark:text-white" title={course.title}>
                                            {course.title}
                                        </h4>
                                        <div className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                                            {course.notes || "لا توجد ملاحظات"}
                                        </div>
                                    </div>
                                    <div className="flex -mt-1 -mr-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => openEdit(course)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(course.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                                    {course.tool && (
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
                                            {course.tool}
                                        </Badge>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <a
                                        href={course.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 dark:bg-white dark:text-slate-900 dark:hover:bg-indigo-50"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        الذهاب للكورس
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showAddModal || showEditModal}
                onClose={() => { setShowAddModal(false); setShowEditModal(false) }}
                title={showEditModal ? "تعديل الكورس" : "إضافة كورس جديد"}
            >
                <div className="space-y-4">
                    <Input
                        label="عنوان الكورس"
                        placeholder="مثال: دورة React المتقدمة"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        autoComplete="off"
                        name="course_title_modal"
                    />
                    <Input
                        label="رابط الكورس"
                        placeholder="https://..."
                        value={formData.url}
                        onChange={e => setFormData({ ...formData, url: e.target.value })}
                        dir="ltr"
                        autoComplete="off"
                        name="course_url_modal"
                    />
                    <Input
                        label="الأداة المستخدمة"
                        placeholder="مثلاً: Cursor, V0, ChatGPT"
                        value={formData.tool}
                        onChange={e => setFormData({ ...formData, tool: e.target.value })}
                        autoComplete="off"
                        name="course_tool_modal"
                    />
                    <Textarea
                        label="ملاحظات"
                        placeholder="أي تفاصيل أو ملاحظات..."
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => { setShowAddModal(false); setShowEditModal(false) }}>
                            إلغاء
                        </Button>
                        <Button onClick={handleSave} isLoading={saving}>
                            حفظ
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
