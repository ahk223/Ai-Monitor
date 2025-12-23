"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { Card, CardContent, Button, Badge } from "@/components/ui"
import {
    Plus,
    Search,
    GraduationCap,
    ExternalLink,
    Trash2,
    Loader2,
    Wrench,
    Tag,
    FileText,
    Heart
} from "lucide-react"
import Link from "next/link"
import { linkifyContent } from "@/lib/utils"
import { useToast, ConfirmModal } from "@/components/ui"
import { useToggleFavorite } from "@/hooks/useToggleFavorite"

interface Course {
    id: string
    name: string
    url: string
    tool?: string
    notes?: string
    categoryId?: string
    createdAt: any
    isFavorite?: boolean
}

interface Category {
    id: string
    name: string
    color: string
}

export default function CoursesPage() {
    const { userData } = useAuth()
    const { showToast } = useToast()
    const [courses, setCourses] = useState<Course[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null })
    
    const { toggleFavorite } = useToggleFavorite(courses, setCourses, {
        collectionName: "courses",
        onSuccess: () => showToast("تم تحديث المفضلة بنجاح", "success"),
        onError: () => showToast("حدث خطأ أثناء تحديث المفضلة", "error"),
    })

    useEffect(() => {
        document.title = "الكورسات | AI Knowledge Hub"
        if (userData?.workspaceId) {
            fetchData()
        }
    }, [userData?.workspaceId])

    const fetchData = async () => {
        if (!userData?.workspaceId) return

        try {
            // Fetch courses
            const coursesQuery = query(
                collection(db, "courses"),
                where("workspaceId", "==", userData.workspaceId)
            )
            const coursesSnap = await getDocs(coursesQuery)
            const coursesList = coursesSnap.docs.map(doc => doc.data() as Course)

            // Sort: favorites first, then by created at desc
            coursesList.sort((a, b) => {
                const aIsFavorite = a.isFavorite ?? false
                const bIsFavorite = b.isFavorite ?? false
                
                if (aIsFavorite && !bIsFavorite) return -1
                if (!aIsFavorite && bIsFavorite) return 1
                
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
                return dateB.getTime() - dateA.getTime()
            })

            setCourses(coursesList)

            // Fetch categories
            const categoriesQuery = query(
                collection(db, "categories"),
                where("workspaceId", "==", userData.workspaceId)
            )
            const categoriesSnap = await getDocs(categoriesQuery)
            setCategories(categoriesSnap.docs.map(doc => doc.data() as Category))
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteDoc(doc(db, "courses", id))
            setCourses(courses.filter(c => c.id !== id))
            showToast("تم حذف الكورس بنجاح", "success")
        } catch (error) {
            console.error("Error deleting course:", error)
            showToast("حدث خطأ أثناء الحذف", "error")
        }
    }

    const getCategoryName = (id?: string) => {
        if (!id) return null
        return categories.find(c => c.id === id)?.name
    }

    const getCategoryColor = (id?: string) => {
        if (!id) return "bg-slate-100 text-slate-700"
        const cat = categories.find(c => c.id === id)
        return cat ? `bg-[${cat.color}]/10 text-[${cat.color}]` : "bg-slate-100 text-slate-700"
    }


    const filteredCourses = courses.filter(course =>
        (course.name || "").toLowerCase().includes(search.toLowerCase()) ||
        course.tool?.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="h-8 w-8 text-indigo-600" />
                        الكورسات التعليمية
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        إدارة ومتابعة الدورات التدريبية والكورسات
                    </p>
                </div>
                <Link href="/dashboard/courses/new">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto">
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة كورس
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="بحث عن كورس..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    autoComplete="off"
                    name="search_courses_query"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.length > 0 ? (
                    filteredCourses.map(course => (
                        <Card key={course.id} hover className="flex flex-col h-full relative">
                            <button
                                onClick={() => toggleFavorite(course.id)}
                                className={`absolute top-2 left-2 rounded-lg p-1.5 transition-colors z-10 ${
                                    course.isFavorite
                                        ? "text-red-500 hover:bg-red-50 hover:text-red-600 bg-white/90"
                                        : "text-slate-400 hover:bg-white/90 hover:text-slate-600 bg-white/70"
                                }`}
                                title={course.isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                            >
                                <Heart className={`h-4 w-4 ${course.isFavorite ? "fill-red-500" : ""}`} />
                            </button>
                            <CardContent className="flex flex-col h-full gap-4 pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                                        <GraduationCap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    {course.categoryId && (
                                        <Badge variant="secondary" className="bg-slate-100 hover:bg-slate-200">
                                            {getCategoryName(course.categoryId)}
                                        </Badge>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 mb-1">
                                        {course.name}
                                    </h3>
                                    {course.tool && (
                                        <div className="flex items-center gap-1 text-sm text-slate-500">
                                            <Wrench className="h-3 w-3" />
                                            <span>{course.tool}</span>
                                        </div>
                                    )}
                                </div>

                                {course.notes && (
                                    <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                                        <FileText className="h-3 w-3 inline-block ml-1 mb-0.5" />
                                        {linkifyContent(course.notes)}
                                    </div>
                                )}

                                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                                    <a
                                        href={course.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        الذهاب للكورس
                                    </a>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/dashboard/courses/${course.id}/edit`}>
                                            <button
                                                className="text-slate-400 hover:text-indigo-600 transition-colors"
                                                title="تعديل"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => setDeleteModal({ isOpen: true, id: course.id })}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                            title="حذف"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <GraduationCap className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                        <p>لا توجد كورسات مضافة</p>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={() => {
                    if (deleteModal.id) {
                        handleDelete(deleteModal.id)
                        setDeleteModal({ isOpen: false, id: null })
                    }
                }}
                title="حذف الكورس"
                message="هل أنت متأكد من حذف هذا الكورس؟ لا يمكن التراجع عن هذه العملية."
                confirmText="حذف"
                cancelText="إلغاء"
                variant="danger"
            />
        </div>
    )
}
