"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore"
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
    FileText
} from "lucide-react"
import Link from "next/link"

interface Course {
    id: string
    name: string
    url: string
    tool?: string
    notes?: string
    categoryId?: string
    createdAt: any
}

interface Category {
    id: string
    name: string
    color: string
}

export default function CoursesPage() {
    const { userData } = useAuth()
    const [courses, setCourses] = useState<Course[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

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

            // Sort by created at desc
            coursesList.sort((a, b) => {
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
        if (!confirm("هل أنت متأكد من حذف هذا الكورس؟")) return

        try {
            await deleteDoc(doc(db, "courses", id))
            setCourses(courses.filter(c => c.id !== id))
        } catch (error) {
            console.error("Error deleting course:", error)
            alert("حدث خطأ أثناء الحذف")
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
                        <Card key={course.id} hover className="flex flex-col h-full">
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
                                        {course.notes}
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
                                    <button
                                        onClick={() => handleDelete(course.id)}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
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
        </div>
    )
}
