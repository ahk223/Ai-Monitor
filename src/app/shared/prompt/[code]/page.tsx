"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { Card, CardContent, Badge } from "@/components/ui"
import {
    MessageSquareText,
    Loader2,
    Lock,
    Star,
} from "lucide-react"
import { linkifyContent } from "@/lib/linkify"

interface Prompt {
    id: string
    title: string
    description: string | null
    content: string
    rating: number | null
    categoryId: string | null
    shareCode: string
    isPublic: boolean
    createdAt: Date
}

interface Category {
    id: string
    name: string
    color: string
}

export default function SharedPromptPage() {
    const params = useParams()
    const shareCode = params.code as string

    const [prompt, setPrompt] = useState<Prompt | null>(null)
    const [category, setCategory] = useState<Category | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [isPrivate, setIsPrivate] = useState(false)

    useEffect(() => {
        if (shareCode) {
            fetchData()
        }
    }, [shareCode])

    const fetchData = async () => {
        try {
            // Find prompt by shareCode
            const promptsQuery = query(
                collection(db, "prompts"),
                where("shareCode", "==", shareCode)
            )
            const promptsSnap = await getDocs(promptsQuery)

            if (promptsSnap.empty) {
                setNotFound(true)
                setLoading(false)
                return
            }

            const promptData = promptsSnap.docs[0].data() as Prompt

            if (!promptData.isPublic) {
                setIsPrivate(true)
                setLoading(false)
                return
            }

            setPrompt({
                ...promptData,
                createdAt: promptData.createdAt instanceof Date ? promptData.createdAt : new Date(promptData.createdAt),
            })

            // Fetch category if exists
            if (promptData.categoryId) {
                const categoryQuery = query(
                    collection(db, "categories"),
                    where("id", "==", promptData.categoryId)
                )
                const categorySnap = await getDocs(categoryQuery)
                if (!categorySnap.empty) {
                    setCategory(categorySnap.docs[0].data() as Category)
                }
            }
        } catch (error) {
            console.error("Error fetching prompt:", error)
            setNotFound(true)
        } finally {
            setLoading(false)
        }
    }

    // Update Page Title
    useEffect(() => {
        if (prompt) {
            document.title = `${prompt.title} | AI Knowledge Hub`
        } else {
            document.title = "بروبمت | AI Knowledge Hub"
        }
    }, [prompt])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (notFound) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 text-center">
                <MessageSquareText className="h-16 w-16 text-slate-300" />
                <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                    البروبمت غير موجود
                </h1>
                <p className="mt-2 text-slate-500">
                    تأكد من صحة الرابط أو تواصل مع صاحب البروبمت
                </p>
            </div>
        )
    }

    if (isPrivate) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 text-center">
                <Lock className="h-16 w-16 text-slate-300" />
                <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                    بروبمت خاص
                </h1>
                <p className="mt-2 text-slate-500">
                    هذا البروبمت غير متاح للعرض العام
                </p>
            </div>
        )
    }

    if (!prompt) return null

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
            <div className="mx-auto max-w-3xl space-y-6">
                {/* Header */}
                <div className="text-center">
                    <Badge className="mb-4">بروبمت</Badge>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                        {prompt.title}
                    </h1>
                    {prompt.description && (
                        <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-400">
                            {prompt.description}
                        </p>
                    )}
                    <div className="mt-4 flex items-center justify-center gap-4">
                        {category && (
                            <Badge style={{ backgroundColor: category.color + "20", color: category.color }}>
                                {category.name}
                            </Badge>
                        )}
                        {prompt.rating && (
                            <div className="flex items-center gap-1 text-amber-500">
                                <Star className="h-5 w-5 fill-amber-500" />
                                <span className="text-sm font-medium">{prompt.rating.toFixed(1)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <Card>
                    <CardContent className="py-6">
                        <div className="mb-4">
                            <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                محتوى البروبمت
                            </h2>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                            <pre className="whitespace-pre-wrap font-mono text-sm text-slate-900 dark:text-slate-100">
                                {linkifyContent(prompt.content)}
                            </pre>
                        </div>
                        <p className="mt-6 text-xs text-slate-400">
                            {prompt.createdAt.toLocaleDateString("ar-SA", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="pt-8 text-center">
                    <p className="text-sm text-slate-400">
                        مُنشأ بواسطة AI Knowledge Hub
                    </p>
                </div>
            </div>
        </div>
    )
}

