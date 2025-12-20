"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore"
import { Button, Input, Textarea, Card, CardContent, Select } from "@/components/ui"
import { ArrowRight, Save, Sparkles, Youtube, Instagram, Video, Twitter, Share2 } from "lucide-react"
import Link from "next/link"

interface Category {
    id: string
    name: string
}

const PLATFORMS = [
    { value: 'x', label: 'X (Twitter)' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'other', label: 'منصة أخرى' },
]

export default function NewSocialMediaPage() {
    const router = useRouter()
    const { userData } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [extractedHandle, setExtractedHandle] = useState("")
    const [form, setForm] = useState({
        url: "",
        platform: "x",
        importance: "",
        categoryId: "",
    })

    useEffect(() => {
        if (userData?.workspaceId) {
            fetchCategories()
        }
    }, [userData?.workspaceId])

    // Auto-detect platform and handle from URL
    useEffect(() => {
        const url = form.url.trim().toLowerCase()
        if (!url) {
            setExtractedHandle("")
            return
        }

        let detectedPlatform = form.platform

        if (url.includes('twitter.com') || url.includes('x.com')) {
            detectedPlatform = 'x'
            const match = url.match(/(?:twitter\.com|x\.com)\/([^\/]+)\/status/)
            if (match && match[1]) setExtractedHandle("@" + match[1])
        } else if (url.includes('instagram.com')) {
            detectedPlatform = 'instagram'
            setExtractedHandle("")
        } else if (url.includes('tiktok.com')) {
            detectedPlatform = 'tiktok'
            const match = url.match(/@([^\/]+)/)
            if (match && match[1]) setExtractedHandle("@" + match[1])
        } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
            detectedPlatform = 'youtube'
            setExtractedHandle("")
        }

        if (detectedPlatform !== form.platform) {
            setForm(prev => ({ ...prev, platform: detectedPlatform }))
        }
    }, [form.url])

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
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userData?.workspaceId) return

        setIsLoading(true)

        try {
            const docId = doc(collection(db, "tweets")).id

            await setDoc(doc(db, "tweets", docId), {
                id: docId,
                workspaceId: userData.workspaceId,
                content: null, // Will be fetched later or left empty
                authorHandle: extractedHandle || null,
                authorName: null,
                importance: form.importance || null,
                categoryId: form.categoryId || null,
                sourceUrl: form.url,
                platform: form.platform,
                isArchived: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            router.push("/dashboard/tweets")
        } catch (error) {
            console.error("Failed to create item:", error)
            alert("حدث خطأ")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/tweets">
                    <Button variant="ghost" size="icon">
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        إضافة محتوى سوشيال ميديا
                    </h1>
                    <p className="text-slate-500">احفظ محتوى ملهم للرجوع إليه لاحقاً</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardContent className="space-y-5">
                        {/* URL */}
                        <div>
                            <Input
                                label="رابط المحتوى"
                                placeholder="انسخ الرابط هنا..."
                                value={form.url}
                                onChange={(e) => setForm({ ...form, url: e.target.value })}
                                required
                            />
                            {extractedHandle && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
                                    <Sparkles className="h-4 w-4" />
                                    <span>تم استخراج الحساب: <strong>{extractedHandle}</strong></span>
                                </div>
                            )}
                        </div>

                        {/* Platform Select */}
                        <Select
                            label="المنصة"
                            placeholder="اختر المنصة"
                            value={form.platform}
                            onChange={(e) => setForm({ ...form, platform: e.target.value })}
                            options={PLATFORMS}
                        />

                        {/* Importance */}
                        <Textarea
                            label="ملاحظات / سبب الحفظ"
                            placeholder="لماذا هذا المحتوى مهم؟"
                            value={form.importance}
                            onChange={(e) => setForm({ ...form, importance: e.target.value })}
                            className="min-h-[100px]"
                            required
                        />

                        {/* Category */}
                        <Select
                            label="التصنيف"
                            placeholder="اختر تصنيفًا"
                            value={form.categoryId}
                            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                            options={categories.map((c) => ({ value: c.id, label: c.name }))}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/dashboard/tweets">
                        <Button variant="outline" type="button">
                            إلغاء
                        </Button>
                    </Link>
                    <Button type="submit" isLoading={isLoading}>
                        <Save className="h-4 w-4" />
                        حفظ المحتوى
                    </Button>
                </div>
            </form>
        </div>
    )
}
