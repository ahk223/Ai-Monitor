"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { Card, CardContent, Button, Badge } from "@/components/ui"
import {
    Plus,
    Search,
    BookOpen,
    Trash2,
    Loader2,
    ChevronLeft,
    Heart,
} from "lucide-react"
import Link from "next/link"
import { linkifyContent } from "@/lib/utils"
import { useToast, ConfirmModal } from "@/components/ui"
import { useToggleFavorite } from "@/hooks/useToggleFavorite"

interface Playbook {
    id: string
    title: string
    description: string | null
    createdAt: Date
    isArchived: boolean
    isFavorite?: boolean
}

interface PlaybookStep {
    id: string
    playbookId: string
    title: string
    order: number
}

export default function PlaybooksPage() {
    const { userData } = useAuth()
    const { showToast } = useToast()
    const [playbooks, setPlaybooks] = useState<Playbook[]>([])
    const [stepCounts, setStepCounts] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null })
    
    const { toggleFavorite } = useToggleFavorite(playbooks, setPlaybooks, {
        collectionName: "playbooks",
        onSuccess: () => showToast("تم تحديث المفضلة بنجاح", "success"),
        onError: () => showToast("حدث خطأ أثناء تحديث المفضلة", "error"),
    })

    useEffect(() => {
        if (userData?.workspaceId) {
            fetchData()
        }
    }, [userData?.workspaceId])

    const fetchData = async () => {
        if (!userData?.workspaceId) return

        try {
            // Fetch playbooks
            const playbooksQuery = query(
                collection(db, "playbooks"),
                where("workspaceId", "==", userData.workspaceId),
                where("isArchived", "==", false)
            )
            const playbooksSnap = await getDocs(playbooksQuery)
            const playbooksList = playbooksSnap.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            })) as Playbook[]

            playbooksList.sort((a, b) => {
                const aIsFavorite = a.isFavorite ?? false
                const bIsFavorite = b.isFavorite ?? false
                
                if (aIsFavorite && !bIsFavorite) return -1
                if (!aIsFavorite && bIsFavorite) return 1
                
                const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
                const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
                return dateB.getTime() - dateA.getTime()
            })

            setPlaybooks(playbooksList)

            // Fetch step counts for each playbook
            const counts: Record<string, number> = {}
            for (const playbook of playbooksList) {
                const stepsQuery = query(
                    collection(db, "playbookItems"),
                    where("playbookId", "==", playbook.id)
                )
                const stepsSnap = await getDocs(stepsQuery)
                counts[playbook.id] = stepsSnap.size
            }
            setStepCounts(counts)
        } catch (error) {
            console.error("Error fetching playbooks:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await updateDoc(doc(db, "playbooks", id), { isArchived: true })
            setPlaybooks(playbooks.filter(p => p.id !== id))
            showToast("تم حذف الـ Playbook بنجاح", "success")
        } catch (error) {
            console.error("Error deleting playbook:", error)
            showToast("حدث خطأ أثناء الحذف", "error")
        }
    }

    const filteredPlaybooks = playbooks.filter(playbook => {
        return !search ||
            playbook.title.toLowerCase().includes(search.toLowerCase()) ||
            (playbook.description && playbook.description.toLowerCase().includes(search.toLowerCase()))
    })


    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Playbooks
                    </h1>
                    <p className="text-slate-500">{playbooks.length} playbook في مكتبتك</p>
                </div>
                <Link href="/dashboard/playbooks/new">
                    <Button>
                        <Plus className="h-4 w-4" />
                        إضافة Playbook
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="ابحث في الـ Playbooks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 pr-10 pl-4 transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900"
                />
            </div>

            {/* Playbooks Grid */}
            {filteredPlaybooks.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-4 font-medium text-slate-900 dark:text-white">
                            لا توجد Playbooks
                        </h3>
                        <p className="mt-1 text-slate-500">
                            ابدأ بإضافة أول Playbook
                        </p>
                        <Link href="/dashboard/playbooks/new" className="mt-4 inline-block">
                            <Button>
                                <Plus className="h-4 w-4" />
                                إضافة Playbook
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredPlaybooks.map(playbook => (
                        <Card key={playbook.id} hover className="group relative">
                            <button
                                onClick={() => toggleFavorite(playbook.id)}
                                className={`absolute top-2 left-2 rounded-lg p-1.5 transition-colors z-10 ${
                                    playbook.isFavorite
                                        ? "text-red-500 hover:bg-red-50 hover:text-red-600 bg-white/90"
                                        : "text-slate-400 hover:bg-white/90 hover:text-slate-600 bg-white/70"
                                }`}
                                title={playbook.isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                            >
                                <Heart className={`h-4 w-4 ${playbook.isFavorite ? "fill-red-500" : ""}`} />
                            </button>
                            <CardContent>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                                            <BookOpen className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                                {playbook.title}
                                            </h3>
                                            <p className="text-sm text-slate-500">
                                                {stepCounts[playbook.id] || 0} خطوة
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {playbook.description && (
                                    <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                                        {linkifyContent(playbook.description)}
                                    </p>
                                )}

                                <div className="mt-4 flex items-center justify-between">
                                    <Link
                                        href={`/dashboard/playbooks/${playbook.id}`}
                                        className="flex items-center gap-1 text-sm text-indigo-600 hover:underline"
                                    >
                                        عرض التفاصيل
                                        <ChevronLeft className="h-4 w-4" />
                                    </Link>
                                    <div className="flex items-center gap-1">
                                        <Link href={`/dashboard/playbooks/${playbook.id}/edit`}>
                                            <button
                                                className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                                                title="تعديل"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => setDeleteModal({ isOpen: true, id: playbook.id })}
                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                            title="حذف"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={() => {
                    if (deleteModal.id) {
                        handleDelete(deleteModal.id)
                        setDeleteModal({ isOpen: false, id: null })
                    }
                }}
                title="حذف الـ Playbook"
                message="هل أنت متأكد من حذف هذا الـ Playbook؟ لا يمكن التراجع عن هذه العملية."
                confirmText="حذف"
                cancelText="إلغاء"
                variant="danger"
            />
        </div>
    )
}
