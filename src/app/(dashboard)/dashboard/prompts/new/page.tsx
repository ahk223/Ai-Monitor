"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { db, storage } from "@/lib/firebase"
import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Button, Input, Textarea, Card, CardContent, Select, ImageUpload } from "@/components/ui"
import { ArrowRight, Save, Wand2, Image } from "lucide-react"
import Link from "next/link"

interface Category {
    id: string
    name: string
}

interface Attachment {
    id: string
    url: string
    originalName: string
    mimeType: string
}

export default function NewPromptPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { userData } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [showUpload, setShowUpload] = useState(false)
    const [form, setForm] = useState({
        title: "",
        description: "",
        content: "",
        categoryId: searchParams.get("categoryId") || "",
    })

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
        if (!userData?.workspaceId) return

        setIsLoading(true)

        try {
            // Generate new prompt ID
            const promptId = doc(collection(db, "prompts")).id

            // Create prompt document
            await setDoc(doc(db, "prompts", promptId), {
                id: promptId,
                workspaceId: userData.workspaceId,
                title: form.title,
                description: form.description || null,
                content: form.content,
                categoryId: form.categoryId || null,
                rating: null,
                usageCount: 0,
                isArchived: false,
                isFavorite: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            // Create first version
            const versionId = doc(collection(db, "promptVersions")).id
            await setDoc(doc(db, "promptVersions", versionId), {
                id: versionId,
                promptId,
                version: 1,
                content: form.content,
                changeNote: "الإصدار الأول",
                createdAt: new Date(),
            })

            // Extract and save variables
            const variables = detectVariables()
            for (const varName of variables) {
                const varId = doc(collection(db, "promptVariables")).id
                await setDoc(doc(db, "promptVariables", varId), {
                    id: varId,
                    promptId,
                    name: varName,
                    description: null,
                    defaultValue: null,
                })
            }

            // Update attachments with promptId
            for (const attachment of attachments) {
                await setDoc(doc(db, "attachments", attachment.id), {
                    ...attachment,
                    promptId,
                }, { merge: true })
            }

            router.push(`/dashboard/prompts/${promptId}`)
        } catch (error) {
            console.error("Failed to create prompt:", error)
            alert("حدث خطأ")
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpload = async (file: File): Promise<Attachment> => {
        if (!userData?.workspaceId) throw new Error("No workspace")

        const attachmentId = doc(collection(db, "attachments")).id
        const storageRef = ref(storage, `attachments/${userData.workspaceId}/${attachmentId}-${file.name}`)

        await uploadBytes(storageRef, file)
        const url = await getDownloadURL(storageRef)

        const attachment: Attachment = {
            id: attachmentId,
            url,
            originalName: file.name,
            mimeType: file.type,
        }

        // Save to Firestore
        await setDoc(doc(db, "attachments", attachmentId), {
            ...attachment,
            size: file.size,
            createdAt: new Date(),
        })

        return attachment
    }

    const handleAttachmentUpload = (attachment: Attachment) => {
        setAttachments(prev => [...prev, attachment])
    }

    const handleRemoveAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id))
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

                        {/* Image Upload Section */}
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    نماذج وصور (اختياري)
                                </label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowUpload(!showUpload)}
                                >
                                    <Image className="h-4 w-4" />
                                    {showUpload ? "إخفاء" : "إضافة صور"}
                                </Button>
                            </div>

                            {showUpload && (
                                <ImageUpload
                                    attachments={attachments}
                                    onUpload={handleAttachmentUpload}
                                    onRemove={handleRemoveAttachment}
                                    entityType="prompt"
                                    workspaceId={userData?.workspaceId || undefined}
                                />
                            )}

                            {/* Show uploaded images even when upload area is hidden */}
                            {!showUpload && attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {attachments.map((a) => (
                                        <div
                                            key={a.id}
                                            className="relative h-16 w-16 overflow-hidden rounded-lg border"
                                        >
                                            <img
                                                src={a.url}
                                                alt={a.originalName}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ))}
                                    <span className="self-center text-xs text-slate-500">
                                        {attachments.length} صورة
                                    </span>
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
