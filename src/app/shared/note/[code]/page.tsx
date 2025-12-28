"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { Card, CardContent, Badge, CollapsibleNoteContent } from "@/components/ui"
import {
    StickyNote,
    Loader2,
    Lock,
} from "lucide-react"

interface Note {
    id: string
    title: string
    content: string
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

export default function SharedNotePage() {
    const params = useParams()
    const shareCode = params.code as string

    const [note, setNote] = useState<Note | null>(null)
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
            // Find note by shareCode
            const notesQuery = query(
                collection(db, "notes"),
                where("shareCode", "==", shareCode)
            )
            const notesSnap = await getDocs(notesQuery)

            if (notesSnap.empty) {
                setNotFound(true)
                setLoading(false)
                return
            }

            const noteData = notesSnap.docs[0].data() as Note

            if (!noteData.isPublic) {
                setIsPrivate(true)
                setLoading(false)
                return
            }

            setNote({
                ...noteData,
                createdAt: noteData.createdAt instanceof Date ? noteData.createdAt : new Date(noteData.createdAt),
            })

            // Fetch category if exists
            if (noteData.categoryId) {
                const categoryQuery = query(
                    collection(db, "categories"),
                    where("id", "==", noteData.categoryId)
                )
                const categorySnap = await getDocs(categoryQuery)
                if (!categorySnap.empty) {
                    setCategory(categorySnap.docs[0].data() as Category)
                }
            }
        } catch (error) {
            console.error("Error fetching note:", error)
            setNotFound(true)
        } finally {
            setLoading(false)
        }
    }

    // Update Page Title
    useEffect(() => {
        if (note) {
            document.title = `${note.title} | AI Knowledge Hub`
        } else {
            document.title = "ملاحظة | AI Knowledge Hub"
        }
    }, [note])

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
                <StickyNote className="h-16 w-16 text-slate-300" />
                <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                    الملاحظة غير موجودة
                </h1>
                <p className="mt-2 text-slate-500">
                    تأكد من صحة الرابط أو تواصل مع صاحب الملاحظة
                </p>
            </div>
        )
    }

    if (isPrivate) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 text-center">
                <Lock className="h-16 w-16 text-slate-300" />
                <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                    ملاحظة خاصة
                </h1>
                <p className="mt-2 text-slate-500">
                    هذه الملاحظة غير متاحة للعرض العام
                </p>
            </div>
        )
    }

    if (!note) return null

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
            <div className="mx-auto max-w-3xl space-y-6">
                {/* Header */}
                <div className="text-center">
                    <Badge className="mb-4">ملاحظة</Badge>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                        {note.title || "ملاحظة بدون عنوان"}
                    </h1>
                    {category && (
                        <div className="mt-3">
                            <Badge style={{ backgroundColor: category.color + "20", color: category.color }}>
                                {category.name}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Content */}
                <Card>
                    <CardContent className="py-6">
                        <CollapsibleNoteContent content={note.content} />
                        <p className="mt-6 text-xs text-slate-400">
                            {note.createdAt.toLocaleDateString("en-US", {
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

