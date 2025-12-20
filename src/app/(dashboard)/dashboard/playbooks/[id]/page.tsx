"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc, deleteDoc, orderBy } from "firebase/firestore"
import { Button, Input, Textarea, Card, CardContent, Badge, Modal } from "@/components/ui"
import {
    ArrowRight,
    Plus,
    Share2,
    Trash2,
    ExternalLink,
    MoreVertical,
    Check,
    CheckCircle2,
    Circle,
    Play,
    AlertTriangle,
    AlignLeft,
    GripVertical,
    Youtube,
    FileText,
    Link2,
    RotateCcw,
    ChevronUp,
    ChevronDown,
    Copy,
    Globe,
    Lock,
    Loader2,
    BookOpen,
    Edit2,
} from "lucide-react"
import { StarRating } from "@/components/ui/star-rating"
import Link from "next/link"

interface Playbook {
    id: string
    title: string
    description: string | null
    toolUrl: string | null
    shareCode: string
    isPublic: boolean
    categoryId: string | null
    clonedFromId?: string | null
    lastSyncedItemCount?: number
}

interface PlaybookItem {
    id: string
    playbookId: string
    title: string
    url: string
    description: string | null
    order: number
    clonedFromItemId?: string
}

interface NewContentInfo {
    count: number
    items: PlaybookItem[]
}

interface ItemProgress {
    itemId: string
    completed: boolean
}

export default function PlaybookDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { userData } = useAuth()
    const playbookId = params.id as string

    const [playbook, setPlaybook] = useState<Playbook | null>(null)
    const [items, setItems] = useState<PlaybookItem[]>([])
    const [progress, setProgress] = useState<Record<string, { completed: boolean; rating?: number; notes?: string }>>({})
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [newItem, setNewItem] = useState({ title: "", url: "", description: "" })
    const [editingItem, setEditingItem] = useState<PlaybookItem | null>(null)
    const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
    const [savingItem, setSavingItem] = useState(false)
    const [copied, setCopied] = useState(false)
    const [duplicateWarning, setDuplicateWarning] = useState<{ message: string; playbookTitle?: string } | null>(null)
    const [checkingDuplicate, setCheckingDuplicate] = useState(false)
    const [newContent, setNewContent] = useState<NewContentInfo | null>(null)
    const [syncingContent, setSyncingContent] = useState(false)
    const [showArchived, setShowArchived] = useState(false)

    useEffect(() => {
        if (playbookId) {
            fetchData()
        }
    }, [playbookId])

    const fetchData = async () => {
        try {
            // Fetch playbook
            const playbookDoc = await getDoc(doc(db, "playbooks", playbookId))
            if (!playbookDoc.exists()) {
                router.push("/dashboard/playbooks")
                return
            }
            setPlaybook(playbookDoc.data() as Playbook)

            // Fetch items
            const itemsQuery = query(
                collection(db, "playbookItems"),
                where("playbookId", "==", playbookId)
            )
            const itemsSnap = await getDocs(itemsQuery)
            const itemsList = itemsSnap.docs.map(doc => doc.data() as PlaybookItem)
            itemsList.sort((a, b) => a.order - b.order)
            setItems(itemsList)

            // Fetch user progress
            if (userData?.id) {
                const progressQuery = query(
                    collection(db, "playbookProgress"),
                    where("playbookId", "==", playbookId),
                    where("userId", "==", userData.id)
                )
                const progressSnap = await getDocs(progressQuery)
                const progressMap: Record<string, { completed: boolean; rating?: number; notes?: string }> = {}
                progressSnap.docs.forEach(doc => {
                    const data = doc.data()
                    progressMap[data.itemId] = {
                        completed: data.completed,
                        rating: data.rating,
                        notes: data.notes
                    }
                })
                setProgress(progressMap)
            }

            // Check for new content if this is a cloned playbook
            const pbData = playbookDoc.data() as Playbook
            if (pbData.clonedFromId) {
                checkForNewContent(pbData.clonedFromId, itemsList)
            }
        } catch (error) {
            console.error("Error fetching playbook:", error)
        } finally {
            setLoading(false)
        }
    }

    // Update Page Title
    useEffect(() => {
        if (playbook) {
            document.title = `${playbook.title} | AI Knowledge Hub`
        }
    }, [playbook])

    const checkForNewContent = async (originalPlaybookId: string, currentItems: PlaybookItem[]) => {
        try {
            // Get items from original playbook
            const originalItemsQuery = query(
                collection(db, "playbookItems"),
                where("playbookId", "==", originalPlaybookId)
            )
            const originalSnap = await getDocs(originalItemsQuery)
            const originalItems = originalSnap.docs.map(doc => doc.data() as PlaybookItem)

            // Find items that don't exist in our cloned version
            const clonedFromIds = currentItems.map(i => i.clonedFromItemId).filter(Boolean)
            const newItems = originalItems.filter(item => !clonedFromIds.includes(item.id))

            if (newItems.length > 0) {
                setNewContent({ count: newItems.length, items: newItems })
            }
        } catch (error) {
            console.error("Error checking for new content:", error)
        }
    }

    // Extract YouTube video ID from URL
    function getYouTubeId(url: string | undefined | null): string | null {
        if (!url) return null
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
        return match ? match[1] : null
    }

    // Get YouTube thumbnail URL
    function getYouTubeThumbnail(videoId: string): string {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    }

    const syncNewContent = async () => {
        if (!newContent || !playbook) return

        setSyncingContent(true)
        try {
            const currentMaxOrder = items.length

            for (let i = 0; i < newContent.items.length; i++) {
                const originalItem = newContent.items[i]
                const newItemId = doc(collection(db, "playbookItems")).id

                await setDoc(doc(db, "playbookItems", newItemId), {
                    id: newItemId,
                    playbookId: playbookId,
                    title: originalItem.title,
                    url: originalItem.url,
                    description: originalItem.description,
                    order: currentMaxOrder + i + 1,
                    clonedFromItemId: originalItem.id,
                    createdAt: new Date(),
                })

                setItems(prev => [...prev, {
                    id: newItemId,
                    playbookId: playbookId,
                    title: originalItem.title,
                    url: originalItem.url,
                    description: originalItem.description,
                    order: currentMaxOrder + i + 1,
                    clonedFromItemId: originalItem.id,
                }])
            }

            // Update lastSyncedItemCount
            await updateDoc(doc(db, "playbooks", playbookId), {
                lastSyncedItemCount: items.length + newContent.items.length,
            })

            setNewContent(null)
        } catch (error) {
            console.error("Error syncing content:", error)
            alert("حدث خطأ أثناء المزامنة")
        } finally {
            setSyncingContent(false)
        }
    }

    // Helper functions
    const normalizeUrl = (url: string) => {
        try {
            let cleanUrl = url.trim()
            if (cleanUrl.endsWith('/')) {
                cleanUrl = cleanUrl.slice(0, -1)
            }

            // Standardize YouTube URLs
            const ytMatch = cleanUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
            if (ytMatch && ytMatch[1]) {
                return `https://www.youtube.com/watch?v=${ytMatch[1]}`
            }

            return cleanUrl
        } catch (e) {
            return url
        }
    }

    const checkDuplicateUrl = async (url: string): Promise<{ isDuplicate: boolean; location?: string; playbookTitle?: string }> => {
        if (!url || !userData?.workspaceId) return { isDuplicate: false }

        const cleanUrl = normalizeUrl(url)

        // Check in current playbook (robust check)
        const existsInCurrent = items.some(item => normalizeUrl(item.url) === cleanUrl)
        if (existsInCurrent) {
            return { isDuplicate: true, location: 'current', playbookTitle: playbook?.title }
        }

        // Check in other playbooks
        try {
            const allItemsQuery = query(
                collection(db, "playbookItems"),
                where("url", "==", cleanUrl)
            )
            const snap = await getDocs(allItemsQuery)

            if (!snap.empty) {
                const foundItem = snap.docs[0].data()
                if (foundItem.playbookId !== playbookId) {
                    // Check ownership via playbook
                    const playbookDoc = await getDoc(doc(db, "playbooks", foundItem.playbookId))
                    if (playbookDoc.exists()) {
                        const pbData = playbookDoc.data()
                        // Check workspace match (security/isolation)
                        if (pbData.workspaceId === userData.workspaceId) {
                            return { isDuplicate: true, location: 'other', playbookTitle: pbData?.title || 'Playbook آخر' }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error checking duplicate:", error)
        }

        return { isDuplicate: false }
    }

    const handleAddItem = async (ignoreDuplicate = false) => {
        if (!newItem.title || !newItem.url) return

        const cleanUrl = normalizeUrl(newItem.url)

        if (!ignoreDuplicate) {
            // Check for duplicates first
            setCheckingDuplicate(true)
            const duplicateCheck = await checkDuplicateUrl(cleanUrl)
            setCheckingDuplicate(false)

            if (duplicateCheck.isDuplicate) {
                const locationText = duplicateCheck.location === 'current'
                    ? 'هذا الـ Playbook'
                    : `Playbook "${duplicateCheck.playbookTitle}"`
                setDuplicateWarning({
                    message: `هذا الرابط موجود مسبقاً في ${locationText}`,
                    playbookTitle: duplicateCheck.playbookTitle
                })
                return // Don't add if duplicate
            }
        }

        setSavingItem(true)

        try {
            const itemId = doc(collection(db, "playbookItems")).id
            const newOrder = items.length + 1

            await setDoc(doc(db, "playbookItems", itemId), {
                id: itemId,
                playbookId,
                title: newItem.title,
                url: cleanUrl, // Save clean URL
                description: newItem.description || null,
                order: newOrder,
                createdAt: new Date(),
            })

            setItems([...items, {
                id: itemId,
                playbookId,
                title: newItem.title,
                url: newItem.url,
                description: newItem.description || null,
                order: newOrder,
            }])

            setNewItem({ title: "", url: "", description: "" })
            setDuplicateWarning(null)
            setShowAddModal(false)
        } catch (error) {
            console.error("Error adding item:", error)
        } finally {
            setSavingItem(false)
        }
    }

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا العنصر؟")) return

        try {
            await deleteDoc(doc(db, "playbookItems", itemId))
            setItems(items.filter(item => item.id !== itemId))
        } catch (error) {
            console.error("Error deleting item:", error)
        }
    }

    const openEditModal = (item: PlaybookItem) => {
        setEditingItem(item)
        setShowEditModal(true)
    }

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingItem || !editingItem.title || !editingItem.url) return

        setSavingItem(true)
        try {
            await updateDoc(doc(db, "playbookItems", editingItem.id), {
                title: editingItem.title,
                url: editingItem.url,
                description: editingItem.description || null,
                updatedAt: new Date(),
            })

            setItems(items.map(item =>
                item.id === editingItem.id
                    ? { ...item, ...editingItem }
                    : item
            ))

            setEditingItem(null)
            setShowEditModal(false)
        } catch (error) {
            console.error("Error updating item:", error)
        } finally {
            setSavingItem(false)
        }
    }

    const moveItem = async (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === items.length - 1)
        ) return

        const newItems = [...items]
        const targetIndex = direction === 'up' ? index - 1 : index + 1

        // Swap
        const temp = newItems[index]
        newItems[index] = newItems[targetIndex]
        newItems[targetIndex] = temp

        // Update orders in state
        newItems[index].order = index + 1
        newItems[targetIndex].order = targetIndex + 1

        setItems(newItems)

        // Save to Firestore
        try {
            await updateDoc(doc(db, "playbookItems", newItems[index].id), {
                order: index + 1,
            })
            await updateDoc(doc(db, "playbookItems", newItems[targetIndex].id), {
                order: targetIndex + 1,
            })
        } catch (error) {
            console.error("Error reordering items:", error)
        }
    }

    const handleFeedbackChange = async (itemId: string, updates: { rating?: number; notes?: string; completed?: boolean }) => {
        if (!userData?.id) return

        const current = progress[itemId] || { completed: false }
        const newProgress = { ...current, ...updates }

        // Optimistic update
        setProgress({ ...progress, [itemId]: newProgress })

        try {
            const progressId = `${userData.id}_${itemId}`
            await setDoc(doc(db, "playbookProgress", progressId), {
                id: progressId,
                userId: userData.id,
                playbookId,
                itemId,
                ...newProgress,
                updatedAt: new Date(),
            }, { merge: true })
        } catch (error) {
            console.error("Error updating feedback:", error)
        }
    }

    const handleTogglePublic = async () => {
        if (!playbook) return

        try {
            await updateDoc(doc(db, "playbooks", playbookId), {
                isPublic: !playbook.isPublic,
            })
            setPlaybook({ ...playbook, isPublic: !playbook.isPublic })
        } catch (error) {
            console.error("Error toggling public:", error)
        }
    }

    const getShareUrl = () => {
        if (typeof window !== "undefined") {
            return `${window.location.origin}/shared/playbook/${playbook?.shareCode}`
        }
        return ""
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(getShareUrl())
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
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

    const completedCount = Object.values(progress).filter(p => p.completed).length
    const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!playbook) return null

    return (
        <div className="space-y-6">
            {/* New Content Alert */}
            {newContent && (
                <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 dark:border-indigo-800 dark:from-indigo-900/20 dark:to-purple-900/20">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                                <Plus className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="font-medium text-indigo-900 dark:text-indigo-100">
                                    🎉 محتوى جديد من مالك الـ Playbook!
                                </p>
                                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                    تم إضافة {newContent.count} محتوى جديد. هل تريد إضافتهم لنسختك؟
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setNewContent(null)}>
                                تجاهل
                            </Button>
                            <Button size="sm" onClick={syncNewContent} isLoading={syncingContent}>
                                <Plus className="h-4 w-4" />
                                إضافة للنسخة
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <Link href="/dashboard/playbooks">
                        <Button variant="ghost" size="icon">
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {playbook.title}
                        </h1>
                        {playbook.description && (
                            <p className="mt-1 text-slate-500">{playbook.description}</p>
                        )}
                        {playbook.toolUrl && (
                            <a
                                href={playbook.toolUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
                            >
                                <ExternalLink className="h-4 w-4" />
                                رابط الأداة
                            </a>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Only show archive toggle if there are archived items OR if we are currently viewing archive */}
                    {(items.some(item => progress[item.id]?.completed) || showArchived) && (
                        <Button
                            variant={showArchived ? "secondary" : "ghost"}
                            onClick={() => setShowArchived(!showArchived)}
                            className={showArchived ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300" : ""}
                        >
                            {showArchived ? (
                                <>
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                    عرض القائمة النشطة
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2 text-slate-400" />
                                    عرض الأرشيف
                                </>
                            )}
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => setShowShareModal(true)}>
                        <Share2 className="h-4 w-4" />
                        مشاركة
                    </Button>
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="h-4 w-4" />
                        إضافة محتوى
                    </Button>
                </div>
            </div>

            {/* Progress Bar */}
            <Card>
                <CardContent className="py-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            التقدم: {progressPercent}%
                        </span>
                        <span className="text-sm text-slate-500">
                            {completedCount} من {items.length}
                        </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                            className="h-2 rounded-full bg-indigo-600 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Items List */}
            <div className="space-y-4">
                {showArchived ? (
                    // Archived View
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="mb-4 flex items-center justify-between rounded-lg bg-indigo-50 p-4 text-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900/50">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="font-medium">أرشيف العناصر المكتملة</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setShowArchived(false)}>
                                العودة للقائمة النشطة
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {items.filter(item => progress[item.id]?.completed).length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    لا توجد عناصر في الأرشيف
                                </div>
                            ) : (
                                items
                                    .filter(item => progress[item.id]?.completed)
                                    .map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 opacity-75 transition-all hover:opacity-100 dark:border-slate-800 dark:bg-slate-900"
                                        >
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleFeedbackChange(item.id, { completed: false })}
                                                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-green-500 bg-green-500 text-white transition-all hover:bg-green-600"
                                                    title="استعادة للقائمة الرئيسية"
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <span className="font-medium text-slate-600 line-through dark:text-slate-400">
                                                    {item.title}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {progress[item.id]?.rating && (
                                                    <div className="flex items-center gap-1 text-xs text-amber-500 bg-amber-50 px-2 py-1 rounded-full dark:bg-amber-900/10">
                                                        <span>{progress[item.id]?.rating}</span>
                                                        <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                ) : (
                    items.filter(item => !progress[item.id]?.completed).map((item, index) => {
                        const videoId = getYouTubeId(item.url)
                        const isCompleted = progress[item.id]?.completed

                        return (
                            <div
                                key={item.id}
                                className="relative flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all dark:border-slate-800 dark:bg-slate-950"
                            >
                                {/* Header with Title and Toggle */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1">
                                        <button
                                            onClick={() => handleFeedbackChange(item.id, { completed: !isCompleted })}
                                            className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 hover:border-slate-400 dark:border-slate-600 transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                                            title="تحديد كمكتمل (نقل للأرشيف)"
                                        >
                                            <div className="h-2 w-2 rounded-full bg-slate-300 opacity-0 transition-opacity hover:opacity-100" />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-lg leading-snug text-slate-900 dark:text-white">
                                                {item.title}
                                            </h3>
                                            {item.description && (
                                                <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                                                    {item.description}
                                                </p>
                                            )}
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 dir-ltr"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                {item.url}
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" onClick={() => moveItem(index, 'up')} disabled={index === 0}>
                                                <ArrowRight className="h-4 w-4 rotate-90" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" onClick={() => moveItem(index, 'down')} disabled={index === items.length - 1}>
                                                <ArrowRight className="h-4 w-4 -rotate-90" />
                                            </Button>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => openEditModal(item)}>
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDeleteItem(item.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Video Embed */}
                                {videoId && (
                                    <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-800">
                                        {playingVideoId === item.id ? (
                                            <iframe
                                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                                                title={item.title}
                                                className="absolute inset-0 h-full w-full"
                                                allowFullScreen
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            />
                                        ) : (
                                            <button
                                                onClick={() => setPlayingVideoId(item.id)}
                                                className="group absolute inset-0 flex h-full w-full items-center justify-center"
                                            >
                                                <img
                                                    src={getYouTubeThumbnail(videoId)}
                                                    alt={item.title}
                                                    className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                                                />
                                                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-red-600/90 shadow-lg transition-transform group-hover:scale-110">
                                                    <Play className="h-6 w-6 text-white ml-1 fill-current" />
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Feedback Section */}
                                <div className="mt-2 flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-4 transition-all dark:border-slate-800 dark:bg-slate-900/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">التقييم:</span>
                                        <StarRating
                                            rating={progress[item.id]?.rating || 0}
                                            onRatingChange={(r) => handleFeedbackChange(item.id, { rating: r })}
                                            size={20}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <span className="text-xs text-slate-500">ملاحظاتك:</span>
                                        <Textarea
                                            placeholder="أضف ملاحظاتك الخاصة هنا..."
                                            value={progress[item.id]?.notes || ""}
                                            onChange={(e) => handleFeedbackChange(item.id, { notes: e.target.value })}
                                            className="min-h-[80px] border-slate-200 bg-white focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Add Item Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="إضافة محتوى"
            >
                <div className="space-y-4">
                    <Input
                        label="العنوان"
                        placeholder="مثال: مقدمة في React"
                        value={newItem.title}
                        onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    />
                    <div>
                        <Input
                            label="الرابط"
                            placeholder="https://..."
                            value={newItem.url}
                            onChange={(e) => {
                                setNewItem({ ...newItem, url: e.target.value })
                                setDuplicateWarning(null) // Clear warning on change
                            }}
                        />
                        {duplicateWarning && (
                            <div className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <div className="flex gap-2 items-start">
                                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-medium">{duplicateWarning.message}</p>
                                        <button
                                            type="button"
                                            onClick={() => handleAddItem(true)}
                                            className="mt-2 text-xs font-semibold underline hover:no-underline"
                                        >
                                            إضافة على أي حال
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <Textarea
                        label="الوصف (اختياري)"
                        placeholder="وصف مختصر للمحتوى..."
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setShowAddModal(false)}>
                            إلغاء
                        </Button>
                        <Button
                            onClick={() => handleAddItem(false)}
                            isLoading={savingItem || checkingDuplicate}
                            disabled={!!duplicateWarning && !savingItem} // Disable if warning exists, user must click "Add Anyway" or change URL
                        >
                            {checkingDuplicate ? "جاري الفحص..." : "إضافة"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Item Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="تعديل المحتوى"
            >
                {editingItem && (
                    <div className="space-y-4">
                        <Input
                            label="العنوان"
                            placeholder="عنوان المحتوى"
                            value={editingItem.title}
                            onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                            required
                        />
                        <Input
                            label="الرابط"
                            placeholder="رابط YouTube أو PDF أو أي رابط آخر"
                            value={editingItem.url}
                            onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                            required
                        />
                        <Textarea
                            label="شرح (اختياري)"
                            placeholder="شرح مختصر عن هذا المحتوى..."
                            value={editingItem.description || ""}
                            onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                            className="min-h-[80px]"
                        />
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => {
                                setShowEditModal(false)
                                setEditingItem(null)
                            }}>
                                إلغاء
                            </Button>
                            <Button onClick={handleUpdateItem} isLoading={savingItem}>
                                <Edit2 className="h-4 w-4" />
                                حفظ التعديلات
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
