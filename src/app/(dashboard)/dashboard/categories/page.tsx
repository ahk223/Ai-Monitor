"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { Card, CardContent, Button, Input } from "@/components/ui"
import { FolderKanban, Plus, Search, Heart, FileText, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToggleFavorite } from "@/hooks/useToggleFavorite"
import { useToast } from "@/components/ui"

interface Category {
    id: string
    name: string
    color: string
    isFavorite?: boolean
}

interface CategoryWithStats extends Category {
    itemCount: number
}

export default function CategoriesPage() {
    const { userData } = useAuth()
    const { showToast } = useToast()
    const [categories, setCategories] = useState<CategoryWithStats[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    
    const { toggleFavorite } = useToggleFavorite(categories, setCategories, {
        collectionName: "categories",
        onSuccess: () => showToast("تم تحديث المفضلة بنجاح", "success"),
        onError: () => showToast("حدث خطأ أثناء تحديث المفضلة", "error"),
    })

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
            const cats = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Category))
            
            // Fetch item counts for each category (simplified for better performance)
            const categoriesWithStats = await Promise.all(
                cats.map(async (cat) => {
                    const collections = ['prompts', 'tweets', 'tools', 'playbooks', 'notes', 'courses']
                    let totalCount = 0
                    
                    // Fetch counts in parallel for better performance
                    const countPromises = collections.map(async (coll) => {
                        try {
                            // Try with isArchived first
                            const itemsQuery = query(
                                collection(db, coll),
                                where("workspaceId", "==", userData.workspaceId),
                                where("categoryId", "==", cat.id),
                                where("isArchived", "==", false)
                            )
                            const itemsSnap = await getDocs(itemsQuery)
                            return itemsSnap.size
                        } catch (err) {
                            // Fallback: try without isArchived
                            try {
                                const itemsQuery = query(
                                    collection(db, coll),
                                    where("workspaceId", "==", userData.workspaceId),
                                    where("categoryId", "==", cat.id)
                                )
                                const itemsSnap = await getDocs(itemsQuery)
                                return itemsSnap.size
                            } catch (e) {
                                return 0
                            }
                        }
                    })
                    
                    const counts = await Promise.all(countPromises)
                    totalCount = counts.reduce((sum, count) => sum + count, 0)
                    
                    return { ...cat, itemCount: totalCount } as CategoryWithStats
                })
            )
            
            // Sort: favorites first, then by name
            categoriesWithStats.sort((a, b) => {
                const aIsFavorite = a.isFavorite ?? false
                const bIsFavorite = b.isFavorite ?? false
                
                if (aIsFavorite && !bIsFavorite) return -1
                if (!aIsFavorite && bIsFavorite) return 1
                
                return a.name.localeCompare(b.name)
            })
            
            setCategories(categoriesWithStats)
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
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                        <p className="mt-4 text-slate-500">جاري التحميل...</p>
                    </div>
                </div>
            ) : filteredCategories.length === 0 ? (
                <div className="text-center py-20">
                    <FolderKanban className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 text-lg">
                        {categories.length === 0 ? "لا توجد تصنيفات بعد" : "لا توجد نتائج للبحث"}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredCategories.map(cat => (
                        <div key={cat.id} className="relative">
                            {/* Favorite Button */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    toggleFavorite(cat.id)
                                }}
                                className={`absolute top-3 left-3 z-20 rounded-lg p-1.5 transition-colors shadow-md ${
                                    cat.isFavorite
                                        ? "text-red-500 hover:bg-red-50 hover:text-red-600 bg-white dark:bg-slate-800"
                                        : "text-slate-400 hover:bg-white hover:text-slate-600 bg-white/70 dark:bg-slate-800/70"
                                }`}
                                title={cat.isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                            >
                                <Heart className={`h-4 w-4 ${cat.isFavorite ? "fill-red-500" : ""}`} />
                            </button>
                            
                            <Link href={`/dashboard/categories/${cat.id}`}>
                                <Card className="group relative h-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
                                    {/* Gradient Background */}
                                    <div 
                                        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                                        style={{ 
                                            background: `linear-gradient(135deg, ${cat.color} 0%, ${cat.color}dd 100%)`
                                        }}
                                    />
                                    
                                    <CardContent className="relative p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            {/* Icon with gradient */}
                                            <div className="relative">
                                                <div
                                                    className="h-16 w-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300"
                                                    style={{ 
                                                        background: `linear-gradient(135deg, ${cat.color} 0%, ${cat.color}dd 100%)`,
                                                        boxShadow: `0 10px 25px -5px ${cat.color}40`
                                                    }}
                                                >
                                                    {cat.name.charAt(0)}
                                                </div>
                                            </div>
                                            
                                            {/* Arrow icon on hover */}
                                            <ArrowLeft className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-300 opacity-0 group-hover:opacity-100" />
                                        </div>
                                        
                                        {/* Category Name */}
                                        <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {cat.name}
                                        </h3>
                                        
                                        {/* Item Count */}
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                            <FileText className="h-4 w-4" />
                                            <span className="text-sm font-medium">
                                                {cat.itemCount === 0 
                                                    ? "لا توجد عناصر" 
                                                    : `${cat.itemCount} ${cat.itemCount === 1 ? 'عنصر' : 'عنصر'}`
                                                }
                                            </span>
                                        </div>
                                        
                                        {/* Decorative element */}
                                        <div 
                                            className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            style={{ backgroundColor: cat.color }}
                                        />
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
