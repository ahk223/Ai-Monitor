"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from "@/components/ui"
import {
    Settings,
    Plus,
    Trash2,
    Loader2,
    Palette,
} from "lucide-react"

interface Category {
    id: string
    name: string
    color: string
}

const colorOptions = [
    "#6366f1", // indigo
    "#22c55e", // green
    "#3b82f6", // blue
    "#f59e0b", // amber
    "#ec4899", // pink
    "#ef4444", // red
    "#8b5cf6", // purple
    "#14b8a6", // teal
]

export default function SettingsPage() {
    const { userData, signOut } = useAuth()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [newCategoryColor, setNewCategoryColor] = useState(colorOptions[0])
    const [adding, setAdding] = useState(false)

    useEffect(() => {
        if (userData?.workspaceId) {
            fetchCategories()
        }
    }, [userData?.workspaceId])

    const fetchCategories = async () => {
        if (!userData?.workspaceId) return

        try {
            const categoriesQuery = query(
                collection(db, "categories"),
                where("workspaceId", "==", userData.workspaceId)
            )
            const snap = await getDocs(categoriesQuery)
            const cats = snap.docs.map(doc => doc.data() as Category)
            setCategories(cats)
        } catch (error) {
            console.error("Error fetching categories:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddCategory = async () => {
        if (!userData?.workspaceId || !newCategoryName.trim()) return

        setAdding(true)
        try {
            const categoryId = doc(collection(db, "categories")).id
            const newCategory: Category = {
                id: categoryId,
                name: newCategoryName,
                color: newCategoryColor,
            }

            await setDoc(doc(db, "categories", categoryId), {
                ...newCategory,
                workspaceId: userData.workspaceId,
                createdAt: new Date(),
            })

            setCategories([...categories, newCategory])
            setNewCategoryName("")
            setNewCategoryColor(colorOptions[0])
        } catch (error) {
            console.error("Error adding category:", error)
        } finally {
            setAdding(false)
        }
    }

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا التصنيف؟")) return

        try {
            await deleteDoc(doc(db, "categories", id))
            setCategories(categories.filter(c => c.id !== id))
        } catch (error) {
            console.error("Error deleting category:", error)
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
        <div className="mx-auto max-w-3xl space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    الإعدادات
                </h1>
                <p className="text-slate-500">إدارة حسابك ومساحة العمل</p>
            </div>

            {/* Account Info */}
            <Card>
                <CardHeader>
                    <CardTitle>معلومات الحساب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                                {userData?.name}
                            </p>
                            <p className="text-sm text-slate-500">{userData?.email}</p>
                        </div>
                        <Button variant="outline" onClick={signOut}>
                            تسجيل الخروج
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Workspace Info */}
            <Card>
                <CardHeader>
                    <CardTitle>مساحة العمل</CardTitle>
                </CardHeader>
                <CardContent>
                    <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                            {userData?.workspaceName}
                        </p>
                        <p className="text-sm text-slate-500">
                            الدور: {userData?.role === "OWNER" ? "مالك" : "عضو"}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Categories */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        التصنيفات
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Existing Categories */}
                    <div className="space-y-2">
                        {categories.map(category => (
                            <div
                                key={category.id}
                                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="h-4 w-4 rounded-full"
                                        style={{ backgroundColor: category.color }}
                                    />
                                    <span className="font-medium">{category.name}</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="text-slate-400 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add New Category */}
                    <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            إضافة تصنيف جديد
                        </p>
                        <div className="flex gap-3">
                            <Input
                                placeholder="اسم التصنيف"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="flex-1"
                            />
                            <div className="flex gap-1">
                                {colorOptions.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setNewCategoryColor(color)}
                                        className={`h-8 w-8 rounded-lg transition-all ${newCategoryColor === color
                                                ? "ring-2 ring-indigo-500 ring-offset-2"
                                                : ""
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                        <Button
                            onClick={handleAddCategory}
                            disabled={!newCategoryName.trim() || adding}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4" />
                            إضافة تصنيف
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
