"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { Card, CardContent, Button, Input } from "@/components/ui"
import { FolderKanban, Plus, Search } from "lucide-react"
import Link from "next/link"

interface Category {
    id: string
    name: string
    color: string
}

export default function CategoriesPage() {
    const { userData } = useAuth()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        document.title = "التصنيفات | AI Knowledge Hub"
        if (userData?.workspaceId) {
            fetchCategories()
        }
    }, [userData?.workspaceId])

    const fetchCategories = async () => {
        if (!userData?.workspaceId) return
        try {
            const q = query(
                collection(db, "categories"),
                where("workspaceId", "==", userData.workspaceId)
            )
            const snap = await getDocs(q)
            setCategories(snap.docs.map(doc => doc.data() as Category))
        } catch (error) {
            console.error("Error fetching categories:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredCategories = categories.filter(cat =>
        (cat.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FolderKanban className="h-8 w-8 text-indigo-600" />
                        التصنيفات
                    </h1>
                    <p className="mt-1 text-slate-500">
                        تصفح وإدارة جميع التصنيفات في مساحة العمل
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    placeholder="بحث في التصنيفات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
                />
            </div>

            {/* Categories Grid */}
            {loading ? (
                <div className="text-center py-12">جاري التحميل...</div>
            ) : filteredCategories.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    {categories.length === 0 ? "لا توجد تصنيفات." : "لا توجد نتائج للبحث."}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredCategories.map(cat => (
                        <Link key={cat.id} href={`/dashboard/categories/${cat.id}`}>
                            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                                <CardContent className="pt-6 flex items-center gap-4">
                                    <div
                                        className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
                                        style={{ backgroundColor: cat.color }}
                                    >
                                        {cat.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                                            {cat.name}
                                        </h3>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
