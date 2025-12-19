"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button, Input, Textarea, Card, CardContent, Select } from "@/components/ui"
import { ArrowRight, Save, Loader2, Wand2 } from "lucide-react"
import Link from "next/link"

interface Category {
    id: string
    name: string
}

export default function NewPromptPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [form, setForm] = useState({
        title: "",
        description: "",
        content: "",
        categoryId: "",
    })

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
        }
    }

    const detectVariables = () => {
        const regex = /\{\{(\w+)\}\}/g
        const matches: string[] = []
        let match
        while ((match = regex.exec(form.content)) !== null) {
            if (!matches.includes(match[1])) {
                matches.push(match[1])
            }
        }
        return matches
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch("/api/prompts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })

            if (res.ok) {
                const prompt = await res.json()
                router.push(`/dashboard/prompts/${prompt.id}`)
            } else {
                const data = await res.json()
                alert(data.error || "حدث خطأ")
            }
        } catch (error) {
            console.error("Failed to create prompt:", error)
            alert("حدث خطأ")
        } finally {
            setIsLoading(false)
        }
    }

    const variables = detectVariables()

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/prompts">
                    <Button variant="ghost" size="icon">
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        بروبمت جديد
                    </h1>
                    <p className="text-slate-500">أضف بروبمت جديد إلى مكتبتك</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardContent className="space-y-5">
                        <Input
                            label="العنوان"
                            placeholder="عنوان البروبمت"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            required
                        />

                        <Textarea
                            label="الوصف (اختياري)"
                            placeholder="وصف مختصر للبروبمت وفائدته"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="min-h-[80px]"
                        />

                        <Select
                            label="التصنيف"
                            placeholder="اختر تصنيفًا"
                            value={form.categoryId}
                            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                            options={categories.map((c) => ({ value: c.id, label: c.name }))}
                        />

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                محتوى البروبمت
                            </label>
                            <div className="relative">
                                <textarea
                                    value={form.content}
                                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    placeholder={`اكتب البروبمت هنا...

يمكنك استخدام متغيرات مثل:
{{language}} - اللغة
{{tone}} - النبرة
{{topic}} - الموضوع`}
                                    className="min-h-[250px] w-full rounded-xl border-2 border-slate-200 bg-white p-4 font-mono text-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900"
                                    required
                                />
                            </div>

                            {/* Variables Preview */}
                            {variables.length > 0 && (
                                <div className="mt-3 rounded-xl bg-indigo-50 p-3 dark:bg-indigo-900/20">
                                    <div className="flex items-center gap-2 text-sm font-medium text-indigo-700 dark:text-indigo-400">
                                        <Wand2 className="h-4 w-4" />
                                        المتغيرات المكتشفة:
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {variables.map((v) => (
                                            <span
                                                key={v}
                                                className="rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                                            >
                                                {`{{${v}}}`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/dashboard/prompts">
                        <Button variant="outline" type="button">
                            إلغاء
                        </Button>
                    </Link>
                    <Button type="submit" isLoading={isLoading}>
                        <Save className="h-4 w-4" />
                        حفظ البروبمت
                    </Button>
                </div>
            </form>
        </div>
    )
}
