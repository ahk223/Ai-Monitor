"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2, ArrowUpDown, Filter, CheckCircle2, Circle, Clock } from "lucide-react"

interface LearningTopic {
    id: string
    title: string
    status: "to_learn" | "learning" | "learned"
    priority: "low" | "medium" | "high"
    categoryId: string
    workspaceId: string
    createdAt: any
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

    useEffect(() => {
        if (userData?.workspaceId) {
            fetchData()
        }
    }, [userData?.workspaceId])

    const fetchData = async () => {
        try {
            // 1. Fetch Categories to map names
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
            const topicList = topicSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as LearningTopic))
            
            // Sort by Date (Newest first)
            topicList.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
                return dateB.getTime() - dateA.getTime()
            })

            setTopics(topicList)
        } catch (error) {
            console.error("Error fetching summary:", error)
        } finally {
            setLoading(false)
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
        <Card className="mb-8 overflow-hidden border-indigo-100 dark:border-indigo-900/30 shadow-sm">
            <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/10 pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                        📋 ملخص شامل
                        <span className="text-sm font-normal text-indigo-600 dark:text-indigo-400 bg-white dark:bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                            {topics.length} موضوع
                        </span>
                    </CardTitle>
                    <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                        <button 
                            onClick={() => setFilter("all")}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filter === "all" ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            الكل
                        </button>
                        <button 
                            onClick={() => setFilter("learning")}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filter === "learning" ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            جاري التعلم
                        </button>
                    </div>
                </div>
            </CardHeader>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="px-4 py-3 w-1/2">الموضوع</th>
                            <th className="px-4 py-3">القسم</th>
                            <th className="px-4 py-3">الحالة</th>
                            <th className="px-4 py-3">الأهمية</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredTopics.map((topic) => (
                            <tr key={topic.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                    {topic.title}
                                </td>
                                <td className="px-4 py-3">
                                    {categories[topic.categoryId] && (
                                        <Badge variant="outline" className="font-normal" style={{ 
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
            {filteredTopics.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                    لا توجد مواضيع بهذه الحالة
                </div>
            )}
        </Card>
    )
}

