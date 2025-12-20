"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { db, auth } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore"
import { onAuthStateChanged, User } from "firebase/auth"
import { Card, CardContent, Badge, Button } from "@/components/ui"
import {
    BookOpen,
    Youtube,
    FileText,
    Link2,
    ExternalLink,
    Loader2,
    Lock,
    Play,
    Plus,
    Check,
    LogIn,
} from "lucide-react"
import Link from "next/link"

interface Playbook {
    id: string
    title: string
    description: string | null
    toolUrl: string | null
    shareCode: string
    isPublic: boolean
    workspaceId: string
}

interface PlaybookItem {
    id: string
    playbookId: string
    title: string
    url: string
    description: string | null
    order: number
}

// Extract YouTube video ID from URL
function getYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ]
    for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match) return match[1]
    }
    return null
}

// Get YouTube thumbnail URL
function getYouTubeThumbnail(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}

export default function SharedPlaybookPage() {
    const params = useParams()
    const router = useRouter()
    const shareCode = params.code as string

    const [user, setUser] = useState<User | null>(null)
    const [userData, setUserData] = useState<{ workspaceId: string } | null>(null)
    const [playbook, setPlaybook] = useState<Playbook | null>(null)
    const [items, setItems] = useState<PlaybookItem[]>([])
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [isPrivate, setIsPrivate] = useState(false)
    const [isCloning, setIsCloning] = useState(false)
    const [alreadyCloned, setAlreadyCloned] = useState(false)
    const [clonedPlaybookId, setClonedPlaybookId] = useState<string | null>(null)

    // Check auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser)
            if (firebaseUser) {
                // Get user data
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
                if (userDoc.exists()) {
                    setUserData(userDoc.data() as { workspaceId: string })
                }
            }
        })
        return () => unsubscribe()
    }, [])

    useEffect(() => {
        if (shareCode) {
            fetchData()
        }
    }, [shareCode])

    // Check if already cloned
    useEffect(() => {
        if (user && playbook && userData?.workspaceId) {
            checkIfCloned()
        }
    }, [user, playbook, userData])

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

    const checkIfCloned = async () => {
        if (!userData?.workspaceId || !playbook) return

        try {
            const clonedQuery = query(
                collection(db, "playbooks"),
                where("workspaceId", "==", userData.workspaceId),
                where("clonedFromId", "==", playbook.id)
            )
            const snap = await getDocs(clonedQuery)
            if (!snap.empty) {
                setAlreadyCloned(true)
                setClonedPlaybookId(snap.docs[0].id)
            }
        } catch (error) {
            console.error("Error checking cloned:", error)
        }
    }

    const handleCloneToMyAccount = async () => {
        if (!user || !userData?.workspaceId || !playbook) return

        setIsCloning(true)
        try {
            // Create new playbook
            const newPlaybookId = doc(collection(db, "playbooks")).id
            const newShareCode = Math.random().toString(36).substring(2, 10)

            await setDoc(doc(db, "playbooks", newPlaybookId), {
                id: newPlaybookId,
                workspaceId: userData.workspaceId,
                title: playbook.title,
                description: playbook.description,
                toolUrl: playbook.toolUrl,
                shareCode: newShareCode,
                isPublic: false,
                isArchived: false,
                clonedFromId: playbook.id, // Track original
                clonedAt: new Date(),
                lastSyncedItemCount: items.length,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            // Clone all items
            for (const item of items) {
                const newItemId = doc(collection(db, "playbookItems")).id
                await setDoc(doc(db, "playbookItems", newItemId), {
                    id: newItemId,
                    playbookId: newPlaybookId,
                    title: item.title,
                    url: item.url,
                    description: item.description,
                    order: item.order,
                    clonedFromItemId: item.id,
                    createdAt: new Date(),
                })
            }

            setAlreadyCloned(true)
            setClonedPlaybookId(newPlaybookId)
        } catch (error) {
            console.error("Error cloning playbook:", error)
            alert("حدث خطأ أثناء الإضافة")
        } finally {
            setIsCloning(false)
        }
    }

    const getUrlIcon = (url: string) => {
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            return <Youtube className="h-4 w-4 text-red-500" />
        }
        if (url.includes(".pdf")) {
            return <FileText className="h-4 w-4 text-orange-500" />
        }
        return <Link2 className="h-4 w-4 text-indigo-500" />
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
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 text-center">
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
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 text-center">
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
            <div className="mx-auto max-w-2xl space-y-6">
                {/* Header */}
                <div className="text-center">
                    <Badge className="mb-4">Playbook</Badge>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                        {playbook.title}
                    </h1>
                    {playbook.description && (
                        <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-400">
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

                {/* Add to my account button */}
                <div className="text-center">
                    {loading ? (
                        <div className="flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                        </div>
                    ) : user ? (
                        alreadyCloned ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <Check className="h-4 w-4" />
                                    مُضاف لحسابك
                                </div>
                                <Link href={`/dashboard/playbooks/${clonedPlaybookId}`}>
                                    <Button variant="outline" size="lg" className="border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-900/20">
                                        <ExternalLink className="mr-2 h-4 w-4 text-indigo-500" />
                                        فتح في لوحة التحكم
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <Button
                                onClick={handleCloneToMyAccount}
                                isLoading={isCloning}
                                size="lg"
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                إضافة لحسابي
                            </Button>
                        )
                    ) : (
                        <div className="space-y-3">
                            <Link href="/login">
                                <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                                    <LogIn className="h-4 w-4 mr-2" />
                                    سجل دخول لإضافته لحسابك
                                </Button>
                            </Link>
                            <p className="text-sm text-slate-500">
                                يجب أن يكون لديك حساب لتتمكن من حفظ الـ Playbook ومتابعة تقدمك
                            </p>
                        </div>
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
                        {items.map((item, index) => {
                            const youtubeId = getYouTubeId(item.url)

                            return (
                                <Card key={item.id} className="overflow-hidden">
                                    {/* Header with number and title */}
                                    <div className="flex items-center gap-3 px-4 pt-4">
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white">
                                            {index + 1}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getUrlIcon(item.url)}
                                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                                {item.title}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* YouTube Preview - smaller */}
                                    {youtubeId && (
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="relative block h-36 sm:h-44 mx-4 mt-3 rounded-lg overflow-hidden bg-slate-900"
                                        >
                                            <img
                                                src={getYouTubeThumbnail(youtubeId)}
                                                alt={item.title}
                                                className="h-full w-full object-cover"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-all hover:bg-black/40">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 shadow-lg">
                                                    <Play className="h-6 w-6 text-white fill-white mr-[-2px]" />
                                                </div>
                                            </div>
                                        </a>
                                    )}

                                    <CardContent className="pt-3 text-center">
                                        {item.description && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                                {item.description}
                                            </p>
                                        )}
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            فتح الرابط
                                        </a>
                                    </CardContent>
                                </Card>
                            )
                        })}
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
