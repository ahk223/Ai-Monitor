"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from "@/components/ui"
import { Settings, Palette, Tags, FolderTree, Plus, Trash2, Save } from "lucide-react"

interface Category {
    id: string
    name: string
    color: string
}

interface TaxonomyItem {
    id: string
    name: string
    order: number
}

export default function SettingsPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [newCategory, setNewCategory] = useState({ name: "", color: "#6366f1" })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories")
            if (res.ok) {
                const data = await res.json()
                setCategories(data)
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error)
        } finally {
            setLoading(false)
        }
    }

    const addCategory = async () => {
        if (!newCategory.name) return
        try {
            const res = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCategory),
            })
            if (res.ok) {
                const category = await res.json()
                setCategories([...categories, category])
                setNewCategory({ name: "", color: "#6366f1" })
            }
        } catch (error) {
            console.error("Failed to add category:", error)
        }
    }

    const deleteCategory = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا التصنيف؟")) return
        try {
            await fetch(`/api/categories/${id}`, { method: "DELETE" })
            setCategories(categories.filter((c) => c.id !== id))
        } catch (error) {
            console.error("Failed to delete category:", error)
        }
    }

    const colorOptions = [
        "#6366f1", // Indigo
        "#8b5cf6", // Purple
        "#ec4899", // Pink
        "#ef4444", // Red
        "#f97316", // Orange
        "#eab308", // Yellow
        "#22c55e", // Green
        "#14b8a6", // Teal
        "#06b6d4", // Cyan
        "#3b82f6", // Blue
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">الإعدادات</h1>
                <p className="text-slate-500">إدارة إعدادات مساحة العمل والتصنيفات</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Categories */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FolderTree className="h-5 w-5 text-indigo-600" />
                            التصنيفات
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Add new category */}
                        <div className="flex gap-3">
                            <Input
                                placeholder="اسم التصنيف"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                className="flex-1"
                            />
                            <div className="flex gap-1">
                                {colorOptions.slice(0, 5).map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setNewCategory({ ...newCategory, color })}
                                        className={`h-10 w-10 rounded-lg transition-all ${newCategory.color === color ? "ring-2 ring-offset-2 ring-indigo-500" : ""
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <Button onClick={addCategory}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Category list */}
                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                                ))}
                            </div>
                        ) : categories.length === 0 ? (
                            <p className="text-center text-sm text-slate-500 py-4">لا توجد تصنيفات</p>
                        ) : (
                            <div className="space-y-2">
                                {categories.map((category) => (
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
                                            onClick={() => deleteCategory(category.id)}
                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Workspace Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-indigo-600" />
                            معلومات مساحة العمل
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                            <h3 className="text-lg font-bold">AI Knowledge Hub</h3>
                            <p className="text-white/80 text-sm mt-1">نظام إدارة المعرفة التشغيلية</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500">الخطة</span>
                                <Badge variant="success">Pro</Badge>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500">الأعضاء</span>
                                <span className="font-medium">1</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-slate-500">الدور</span>
                                <Badge>Owner</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Color Palette */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5 text-indigo-600" />
                            لوحة الألوان
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-5 gap-3">
                            {colorOptions.map((color) => (
                                <div
                                    key={color}
                                    className="aspect-square rounded-xl cursor-pointer hover:scale-105 transition-transform"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        <p className="mt-4 text-sm text-slate-500">
                            استخدم هذه الألوان لتصنيفاتك للحفاظ على تناسق الواجهة
                        </p>
                    </CardContent>
                </Card>

                {/* Export */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Save className="h-5 w-5 text-indigo-600" />
                            تصدير البيانات
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                            تصدير البروبمتات (JSON)
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                            تصدير التغريدات (CSV)
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                            تصدير الأدوات (JSON)
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                            تصدير كل البيانات
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
