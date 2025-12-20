"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { Card, CardContent, Badge } from "@/components/ui"
import {
    BookOpen,
    Youtube,
    FileText,
    Link2,
    ExternalLink,
    Loader2,
    Lock,
} from "lucide-react"

interface Playbook {
    id: string
    title: string
    description: string | null
    toolUrl: string | null
    shareCode: string
    isPublic: boolean
}

interface PlaybookItem {
    id: string
    playbookId: string
    title: string
    url: string
    description: string | null
    order: number
}

export default function SharedPlaybookPage() {
    const params = useParams()
    const shareCode = params.code as string

    const [playbook, setPlaybook] = useState<Playbook | null>(null)
    const [items, setItems] = useState<PlaybookItem[]>([])
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
            // Find playbook by shareCode
            const playbooksQuery = query(
                collection(db, "playbooks"),
                where("shareCode", "==", shareCode)
            )
            const playbooksSnap = await getDocs(playbooksQuery)

            if (playbooksSnap.empty) {
                setNotFound(true)
                setLoading(false)
                return
            }

            const playbookData = playbooksSnap.docs[0].data() as Playbook

            if (!playbookData.isPublic) {
                setIsPrivate(true)
                setLoading(false)
                return
            }

            setPlaybook(playbookData)

            // Fetch items
            const itemsQuery = query(
                collection(db, "playbookItems"),
                where("playbookId", "==", playbookData.id)
            )
            const itemsSnap = await getDocs(itemsQuery)
            const itemsList = itemsSnap.docs.map(doc => doc.data() as PlaybookItem)
            itemsList.sort((a, b) => a.order - b.order)
            setItems(itemsList)
        } catch (error) {
            console.error("Error fetching playbook:", error)
            setNotFound(true)
        } finally {
            setLoading(false)
        }
    }

    const getUrlIcon = (url: string) => {
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            return <Youtube className="h-5 w-5 text-red-500" />
        }
        if (url.includes(".pdf")) {
            return <FileText className="h-5 w-5 text-orange-500" />
        }
        return <Link2 className="h-5 w-5 text-indigo-500" />
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (notFound) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
                <BookOpen className="h-16 w-16 text-slate-300" />
                <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                    Playbook غير موجود
                </h1>
                <p className="mt-2 text-slate-500">
                    تأكد من صحة الرابط أو تواصل مع صاحب الـ Playbook
                </p>
            </div>
        )
    }

    if (isPrivate) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
                <Lock className="h-16 w-16 text-slate-300" />
                <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                    Playbook خاص
                </h1>
                <p className="mt-2 text-slate-500">
                    هذا الـ Playbook غير متاح للعرض العام
                </p>
            </div>
        )
    }

    if (!playbook) return null

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
            <div className="mx-auto max-w-3xl space-y-6">
                {/* Header */}
                <div className="text-center">
                    <Badge className="mb-4">Playbook</Badge>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {playbook.title}
                    </h1>
                    {playbook.description && (
                        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
                            {playbook.description}
                        </p>
                    )}
                    {playbook.toolUrl && (
                        <a
                            href={playbook.toolUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400"
                        >
                            <ExternalLink className="h-4 w-4" />
                            رابط الأداة
                        </a>
                    )}
                </div>

                {/* Items count */}
                <div className="text-center">
                    <span className="rounded-full bg-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {items.length} محتوى
                    </span>
                </div>

                {/* Items */}
                {items.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
                            <p className="mt-4 text-slate-500">
                                لا توجد محتويات بعد
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <Card key={item.id} className="overflow-hidden">
                                <CardContent>
                                    <div className="flex items-start gap-4">
                                        {/* Order number */}
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-lg font-bold text-white">
                                            {index + 1}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                {getUrlIcon(item.url)}
                                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                                    {item.title}
                                                </h3>
                                            </div>
                                            {item.description && (
                                                <p className="mt-2 text-slate-600 dark:text-slate-400">
                                                    {item.description}
                                                </p>
                                            )}
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                فتح الرابط
                                            </a>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

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
