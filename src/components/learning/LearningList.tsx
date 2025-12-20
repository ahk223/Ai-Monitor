"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from "firebase/firestore"
import { Button, Input, Textarea, Card, CardContent, Modal, Badge, Select } from "@/components/ui"
import { Plus, Edit2, Trash2, ListTodo, CheckCircle2, Circle, Clock } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface LearningTopic {
    id: string
    title: string
    description?: string
    status: "to_learn" | "learning" | "learned"
    priority: "low" | "medium" | "high"
    categoryId: string
    workspaceId: string
    createdAt: any
}

interface LearningListProps {
    categoryId: string
    categoryName: string
}

export function LearningList({ categoryId, categoryName }: LearningListProps) {
    const { userData } = useAuth()
    const [topics, setTopics] = useState<LearningTopic[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form state
    const [formData, setFormData] = useState<Partial<LearningTopic>>({
        title: "",
        description: "",
        status: "to_learn",
        priority: "medium"
    })
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        if (userData?.workspaceId && categoryId) {
            fetchTopics()
        }
    }, [userData?.workspaceId, categoryId])

    const fetchTopics = async () => {
        try {
            const q = query(
                collection(db, "learningTopics"),
                where("categoryId", "==", categoryId),
                where("workspaceId", "==", userData?.workspaceId)
            )
            const snap = await getDocs(q)
            const loadedTopics = snap.docs.map(d => ({ ...d.data(), id: d.id } as LearningTopic))

            // Sort client-side to avoid need for composite index
            loadedTopics.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
                return dateB.getTime() - dateA.getTime()
            })

            setTopics(loadedTopics)
        } catch (error) {
            console.error("Error fetching topics:", error)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            status: "to_learn",
            priority: "medium"
        })
        setEditingId(null)
    }

    const handleSave = async () => {
        if (!formData.title || !userData?.workspaceId) return

        setSaving(true)
        try {
            const topicData = {
                ...formData,
                categoryId,
                workspaceId: userData.workspaceId,
                updatedAt: new Date()
            }

            if (editingId) {
                await updateDoc(doc(db, "learningTopics", editingId), topicData)
                setTopics(topics.map(t => t.id === editingId ? { ...t, ...topicData, id: editingId } as LearningTopic : t))
                setShowEditModal(false)
            } else {
                const docRef = await addDoc(collection(db, "learningTopics"), {
                    ...topicData,
                    createdAt: new Date()
                })
                setTopics([{ ...topicData, id: docRef.id, createdAt: new Date() } as LearningTopic, ...topics])
                setShowAddModal(false)
            }
            resetForm()
        } catch (error) {
            console.error("Error saving topic:", error)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الموضوع؟")) return
        try {
            await deleteDoc(doc(db, "learningTopics", id))
            setTopics(topics.filter(t => t.id !== id))
        } catch (error) {
            console.error("Error deleting topic:", error)
        }
    }

    const openEdit = (topic: LearningTopic) => {
        setFormData({
            title: topic.title,
            description: topic.description,
            status: topic.status,
            priority: topic.priority
        })
        setEditingId(topic.id)
        setShowEditModal(true)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "to_learn": return <Badge variant="secondary" className="bg-slate-100 text-slate-700">للتعلم</Badge>
            case "learning": return <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">جاري التعلم</Badge>
            case "learned": return <Badge variant="secondary" className="bg-green-100 text-green-700">تم التعلم</Badge>
            default: return null
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high": return "text-red-600 bg-red-50 dark:bg-red-900/20"
            case "medium": return "text-amber-600 bg-amber-50 dark:bg-amber-900/20"
            case "low": return "text-slate-600 bg-slate-50 dark:bg-slate-900/20"
            default: return "text-slate-600"
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <ListTodo className="h-5 w-5 text-indigo-600" />
                    مواضيع للتعلم في {categoryName}
                </h3>
                <Button onClick={() => { resetForm(); setShowAddModal(true) }}>
                    <Plus className="h-4 w-4" />
                    إضافة موضوع
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-10">جاري التحميل...</div>
            ) : topics.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                    <ListTodo className="mx-auto h-12 w-12 text-slate-300" />
                    <h3 className="mt-4 font-medium text-slate-900 dark:text-white">لا توجد مواضيع للتعلم</h3>
                    <p className="mt-1 text-slate-500">سجّل ما تريد تعلمه في هذا المجال</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {topics.map(topic => (
                        <Card key={topic.id} className="group transition-all hover:shadow-md dark:hover:border-slate-700">
                            <CardContent className="p-4 flex items-start gap-4">
                                <div className={`mt-1 h-2 w-2 rounded-full ${topic.status === 'learned' ? 'bg-green-500' : topic.status === 'learning' ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className={`font-medium ${topic.status === 'learned' ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                                                {topic.title}
                                            </h4>
                                            {topic.description && (
                                                <p className="text-sm text-slate-500 mt-1">{topic.description}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(topic.status)}
                                            <Badge variant="secondary" className={`${getPriorityColor(topic.priority)} border border-current bg-transparent`}>
                                                {topic.priority === 'high' ? 'مهم' : topic.priority === 'medium' ? 'عادي' : 'منخفض'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="pt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(topic)}>
                                            <Edit2 className="h-3 w-3 mr-1" />
                                            تعديل
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(topic.id)}>
                                            <Trash2 className="h-3 w-3 mr-1" />
                                            حذف
                                        </Button>
                                    </div>
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
                title={showEditModal ? "تعديل الموضوع" : "إضافة موضوع جديد"}
            >
                <div className="space-y-4">
                    <Input
                        label="عنوان الموضوع"
                        placeholder="مثال: تعلم Hooks في React"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="الحالة"
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                            options={[
                                { value: "to_learn", label: "للتعلم" },
                                { value: "learning", label: "جاري التعلم" },
                                { value: "learned", label: "تم التعلم" }
                            ]}
                        />
                        <Select
                            label="الأهمية"
                            value={formData.priority}
                            onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                            options={[
                                { value: "high", label: "مهم جداً" },
                                { value: "medium", label: "عادي" },
                                { value: "low", label: "منخفض" }
                            ]}
                        />
                    </div>
                    <Textarea
                        label="الوصف / ملاحظات"
                        placeholder="تفاصيل إضافية عما تريد تعلمه..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
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
