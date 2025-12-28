"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from "firebase/firestore"
import { Badge, Card, CardContent, CardHeader, CardTitle, Button, Modal, Input, Textarea, Select } from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2, ArrowUpDown, Filter, CheckCircle2, Circle, Clock, Heart, Edit2 } from "lucide-react"

interface LearningTopic {
    id: string
    title: string
    description?: string
    status: "to_learn" | "learning" | "learned"
    priority: "low" | "medium" | "high"
    categoryId: string
    workspaceId: string
    createdAt: any
    isFavorite?: boolean
}

interface Category {
    id: string
    name: string
    color: string
}

export function LearningSummaryTable() {
    const { userData } = useAuth()
    const [topics, setTopics] = useState<LearningTopic[]>([])
    const [categories, setCategories] = useState<Record<string, Category>>({})
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"all" | "to_learn" | "learning" | "learned">("all")
    
    // Edit Modal State
    const [editingTopic, setEditingTopic] = useState<LearningTopic | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<Partial<LearningTopic>>({})

    useEffect(() => {
        if (userData?.workspaceId) {
            fetchData()
        }
    }, [userData?.workspaceId])

    const fetchData = async () => {
        try {
            // 1. Fetch Categories
            const catQuery = query(collection(db, "categories"), where("workspaceId", "==", userData?.workspaceId))
            const catSnap = await getDocs(catQuery)
            const catMap: Record<string, Category> = {}
            catSnap.docs.forEach(doc => {
                catMap[doc.id] = { ...doc.data(), id: doc.id } as Category
            })
            setCategories(catMap)

            // 2. Fetch All Topics
            const topicQuery = query(collection(db, "learningTopics"), where("workspaceId", "==", userData?.workspaceId))
            const topicSnap = await getDocs(topicQuery)
            const topicList = topicSnap.docs.map(doc => ({ ...doc.data(), id: doc.id, isFavorite: doc.data().isFavorite || false } as LearningTopic))
            
            sortTopics(topicList)
            setTopics(topicList)
        } catch (error) {
            console.error("Error fetching summary:", error)
        } finally {
            setLoading(false)
        }
    }

    const sortTopics = (list: LearningTopic[]) => {
        list.sort((a, b) => {
            // Favorites first
            if (a.isFavorite && !b.isFavorite) return -1
            if (!a.isFavorite && b.isFavorite) return 1

            // Then Date (Newest first)
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
            return dateB.getTime() - dateA.getTime()
        })
    }

    const handleToggleFavorite = async (e: React.MouseEvent, topic: LearningTopic) => {
        e.stopPropagation()
        const newStatus = !topic.isFavorite
        
        // Optimistic Update
        const updatedList = topics.map(t => 
            t.id === topic.id ? { ...t, isFavorite: newStatus } : t
        )
        sortTopics(updatedList)
        setTopics(updatedList)

        try {
            await updateDoc(doc(db, "learningTopics", topic.id), {
                isFavorite: newStatus
            })
        } catch (error) {
            console.error("Error toggling favorite:", error)
            // Revert
            const revertedList = topics.map(t => 
                t.id === topic.id ? { ...t, isFavorite: !newStatus } : t
            )
            sortTopics(revertedList)
            setTopics(revertedList)
        }
    }

    const handleEditClick = (topic: LearningTopic) => {
        setEditingTopic(topic)
        setFormData({
            title: topic.title,
            description: topic.description || "",
            status: topic.status,
            priority: topic.priority
        })
        setIsEditModalOpen(true)
    }

    const handleSaveEdit = async () => {
        if (!editingTopic || !formData.title) return

        setSaving(true)
        try {
            const updatedData = {
                ...formData,
                updatedAt: new Date()
            }

            await updateDoc(doc(db, "learningTopics", editingTopic.id), updatedData)
            
            const updatedList = topics.map(t => 
                t.id === editingTopic.id ? { ...t, ...updatedData } as LearningTopic : t
            )
            sortTopics(updatedList)
            setTopics(updatedList)
            setIsEditModalOpen(false)
            setEditingTopic(null)
        } catch (error) {
            console.error("Error updating topic:", error)
        } finally {
            setSaving(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "to_learn": return <Badge variant="secondary" className="bg-slate-100 text-slate-700 flex w-fit items-center gap-1"><Circle className="h-3 w-3" /> للتعلم</Badge>
            case "learning": return <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 flex w-fit items-center gap-1"><Clock className="h-3 w-3" /> جاري التعلم</Badge>
            case "learned": return <Badge variant="secondary" className="bg-green-100 text-green-700 flex w-fit items-center gap-1"><CheckCircle2 className="h-3 w-3" /> تم التعلم</Badge>
            default: return null
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high": return "text-red-600 bg-red-50"
            case "medium": return "text-amber-600 bg-amber-50"
            case "low": return "text-slate-600 bg-slate-50"
            default: return "text-slate-600"
        }
    }

    const filteredTopics = filter === "all" ? topics : topics.filter(t => t.status === filter)

    if (loading) return <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600" /></div>
    if (topics.length === 0) return null

    return (
        <>
            <Card className="mb-8 overflow-hidden border-indigo-100 dark:border-indigo-900/30 shadow-sm">
                <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/10 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle className="text-base sm:text-lg font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                            📋 ملخص شامل
                            <span className="text-xs sm:text-sm font-normal text-indigo-600 dark:text-indigo-400 bg-white dark:bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                                {topics.length} موضوع
                            </span>
                        </CardTitle>
                        <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
                            <button 
                                onClick={() => setFilter("all")}
                                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === "all" ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                الكل
                            </button>
                            <button 
                                onClick={() => setFilter("learning")}
                                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === "learning" ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                جاري التعلم
                            </button>
                        </div>
                    </div>
                </CardHeader>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3 w-10"></th> {/* Favorite Icon */}
                                <th className="px-4 py-3 w-1/3">الموضوع</th>
                                <th className="px-4 py-3">القسم</th>
                                <th className="px-4 py-3">الحالة</th>
                                <th className="px-4 py-3">الأهمية</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredTopics.map((topic) => (
                                <tr 
                                    key={topic.id} 
                                    className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                    onClick={() => handleEditClick(topic)}
                                >
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={(e) => handleToggleFavorite(e, topic)}
                                            className={`p-1 rounded-full transition-all ${
                                                topic.isFavorite 
                                                    ? "text-rose-500 bg-rose-50 opacity-100" 
                                                    : "text-slate-300 hover:text-rose-400 opacity-0 group-hover:opacity-100"
                                            }`}
                                        >
                                            <Heart className={`h-4 w-4 ${topic.isFavorite ? "fill-current" : ""}`} />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                        <div className="flex items-center gap-2">
                                            {topic.title}
                                            <Edit2 className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                    {categories[topic.categoryId] && (
                                        <Badge variant="secondary" className="font-normal border" style={{ 
                                            backgroundColor: `${categories[topic.categoryId].color}10`,
                                            color: categories[topic.categoryId].color,
                                            borderColor: `${categories[topic.categoryId].color}30`
                                        }}>
                                            {categories[topic.categoryId].name}
                                        </Badge>
                                    )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {getStatusBadge(topic.status)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(topic.priority)}`}>
                                            {topic.priority === 'high' ? 'مهم جداً' : topic.priority === 'medium' ? 'عادي' : 'منخفض'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3 p-4">
                    {filteredTopics.map((topic) => (
                        <Card 
                            key={topic.id} 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleEditClick(topic)}
                        >
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleToggleFavorite(e, topic)
                                            }}
                                            className={`p-1.5 rounded-full transition-all flex-shrink-0 mt-0.5 ${
                                                topic.isFavorite 
                                                    ? "text-rose-500 bg-rose-50" 
                                                    : "text-slate-300"
                                            }`}
                                        >
                                            <Heart className={`h-4 w-4 ${topic.isFavorite ? "fill-current" : ""}`} />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-slate-900 dark:text-white text-base leading-snug">
                                                {topic.title}
                                            </h3>
                                        </div>
                                    </div>
                                    <Edit2 className="h-4 w-4 text-slate-400 flex-shrink-0 mt-1" />
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2">
                                    {categories[topic.categoryId] && (
                                        <Badge variant="secondary" className="font-normal border text-xs" style={{ 
                                            backgroundColor: `${categories[topic.categoryId].color}10`,
                                            color: categories[topic.categoryId].color,
                                            borderColor: `${categories[topic.categoryId].color}30`
                                        }}>
                                            {categories[topic.categoryId].name}
                                        </Badge>
                                    )}
                                    {getStatusBadge(topic.status)}
                                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(topic.priority)}`}>
                                        {topic.priority === 'high' ? 'مهم جداً' : topic.priority === 'medium' ? 'عادي' : 'منخفض'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                {filteredTopics.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                        لا توجد مواضيع بهذه الحالة
                    </div>
                )}
            </Card>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="تعديل الموضوع"
            >
                <div className="space-y-4">
                    <Input
                        label="عنوان الموضوع"
                        value={formData.title || ""}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select
                            label="الحالة"
                            value={formData.status || "to_learn"}
                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                            options={[
                                { value: "to_learn", label: "للتعلم" },
                                { value: "learning", label: "جاري التعلم" },
                                { value: "learned", label: "تم التعلم" }
                            ]}
                        />
                        <Select
                            label="الأهمية"
                            value={formData.priority || "medium"}
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
                        value={formData.description || ""}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                            إلغاء
                        </Button>
                        <Button onClick={handleSaveEdit} isLoading={saving}>
                            حفظ التعديلات
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}
