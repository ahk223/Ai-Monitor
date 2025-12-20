"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { Button, Card, CardContent, Badge, Input, Select } from "@/components/ui"
import { ListTodo, Plus, Search, Filter } from "lucide-react"
import Link from "next/link"
import { LearningList } from "@/components/learning/LearningList"

interface Category {
    id: string
    name: string
    color: string
}

export default function LearningPage() {
    const { userData } = useAuth()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        document.title = "أشياء للتعلم | AI Knowledge Hub"
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
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ListTodo className="h-8 w-8 text-indigo-600" />
                        أشياء للتعلم
                    </h1>
                    <p className="mt-1 text-slate-500">
                        تتبع كل ما تريد تعلمه في جميع المجالات
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    placeholder="بحث في الأقسام..."
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
                    {categories.length === 0 ? "لا توجد أقسام بعد. أضف أقساماً للبدء." : "لا توجد نتائج للبحث."}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredCategories.map(cat => (
                        <Card key={cat.id} className="h-full">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: cat.color }}
                                    />
                                    <h3 className="font-semibold text-lg hover:underline">
                                        <Link href={`/dashboard/categories/${cat.id}`}>{cat.name}</Link>
                                    </h3>
                                </div>
                                <div className="min-h-[200px]">
                                    <LearningList categoryId={cat.id} categoryName={cat.name} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
