"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Card, CardContent, Badge, Button, CollapsibleNoteContent } from "@/components/ui"
import { ArrowRight, Edit2, Share2, Trash2, Loader2, Heart, Globe, Lock, Copy, Check } from "lucide-react"
import Link from "next/link"
import { useToast, ConfirmModal, Modal } from "@/components/ui"

interface Note {
    id: string
    title: string
    content: string
    categoryId: string | null
    createdAt: Date
    updatedAt?: Date
    isFavorite?: boolean
    shareCode?: string
    isPublic?: boolean
}

interface Category {
    id: string
    name: string
    color: string
}

export default function NoteDetailPage() {
    const params = useParams()
    const router = useRouter()
    const noteId = params.id as string
    const { userData } = useAuth()
    const { showToast } = useToast()
    
    const [note, setNote] = useState<Note | null>(null)
    const [category, setCategory] = useState<Category | null>(null)
    const [loading, setLoading] = useState(true)
    const [deleteModal, setDeleteModal] = useState(false)
    const [shareModal, setShareModal] = useState(false)
    const [copied, setCopied] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (noteId && userData?.workspaceId) {
            fetchNote()
        }
    }, [noteId, userData])

    const fetchNote = async () => {
        try {
            const noteDoc = await getDoc(doc(db, "notes", noteId))
            if (!noteDoc.exists()) {
                router.push("/dashboard/notes")
                return
            }

            const noteData = noteDoc.data()
            const createdAt = noteData.createdAt?.toDate ? noteData.createdAt.toDate() : (noteData.createdAt instanceof Date ? noteData.createdAt : new Date())
            const updatedAt = noteData.updatedAt?.toDate ? noteData.updatedAt.toDate() : (noteData.updatedAt instanceof Date ? noteData.updatedAt : undefined)
            
            setNote({
                ...noteData,
                id: noteDoc.id,
                createdAt,
                updatedAt,
            } as Note)

            // Fetch category if exists
            if (noteData.categoryId) {
                const catDoc = await getDoc(doc(db, "categories", noteData.categoryId))
                if (catDoc.exists()) {
                    setCategory(catDoc.data() as Category)
                }
            }
        } catch (error) {
            console.error("Error fetching note:", error)
            router.push("/dashboard/notes")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!note) return
        
        setDeleting(true)
        try {
            const { deleteDoc } = await import("firebase/firestore")
            await deleteDoc(doc(db, "notes", note.id))
            showToast("تم حذف الملاحظة بنجاح", "success")
            router.push("/dashboard/notes")
        } catch (error) {
            console.error("Error deleting note:", error)
            showToast("حدث خطأ أثناء الحذف", "error")
        } finally {
            setDeleting(false)
            setDeleteModal(false)
        }
    }

    const handleTogglePublic = async () => {
        if (!note) return

        const { updateDoc } = await import("firebase/firestore")
        
        if (!note.shareCode) {
            const shareCode = Math.random().toString(36).substring(2, 10)
            try {
                await updateDoc(doc(db, "notes", note.id), {
                    shareCode,
                    isPublic: !note.isPublic,
                })
                setNote({ ...note, shareCode, isPublic: !note.isPublic })
                showToast("تم تحديث إعدادات المشاركة", "success")
            } catch (error) {
                console.error("Error updating share settings:", error)
                showToast("حدث خطأ أثناء التحديث", "error")
            }
        } else {
            try {
                await updateDoc(doc(db, "notes", note.id), {
                    isPublic: !note.isPublic,
                })
                setNote({ ...note, isPublic: !note.isPublic })
                showToast("تم تحديث إعدادات المشاركة", "success")
            } catch (error) {
                console.error("Error updating share settings:", error)
                showToast("حدث خطأ أثناء التحديث", "error")
            }
        }
    }

    const getShareUrl = () => {
        if (typeof window !== "undefined" && note?.shareCode) {
            return `${window.location.origin}/shared/note/${note.shareCode}`
        }
        return ""
    }

    const handleCopyLink = () => {
        const url = getShareUrl()
        if (url) {
            navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleToggleFavorite = async () => {
        if (!note) return
        
        const { updateDoc } = await import("firebase/firestore")
        const newFavoriteStatus = !note.isFavorite
        
        try {
            await updateDoc(doc(db, "notes", note.id), {
                isFavorite: newFavoriteStatus,
            })
            setNote({ ...note, isFavorite: newFavoriteStatus })
            showToast("تم تحديث المفضلة بنجاح", "success")
        } catch (error) {
            console.error("Error toggling favorite:", error)
            showToast("حدث خطأ أثناء تحديث المفضلة", "error")
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!note) return null

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/notes">
                        <Button variant="ghost" size="icon">
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                            {note.title || "ملاحظة بدون عنوان"}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            {note.createdAt.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToggleFavorite}
                        className={`rounded-lg p-2 transition-colors ${
                            note.isFavorite
                                ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                        title={note.isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                    >
                        <Heart className={`h-5 w-5 ${note.isFavorite ? "fill-red-500" : ""}`} />
                    </button>
                    <button
                        onClick={() => setShareModal(true)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30"
                        title="مشاركة"
                    >
                        <Share2 className="h-5 w-5" />
                    </button>
                    <Link href={`/dashboard/notes/${note.id}/edit`}>
                        <button
                            className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30"
                            title="تعديل"
                        >
                            <Edit2 className="h-5 w-5" />
                        </button>
                    </Link>
                    <button
                        onClick={() => setDeleteModal(true)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                        title="حذف"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Category Badge */}
            {category && (
                <div>
                    <Badge
                        style={{ backgroundColor: category.color + "20", color: category.color }}
                    >
                        {category.name}
                    </Badge>
                </div>
            )}

            {/* Content */}
            <Card>
                <CardContent className="py-6">
                    <CollapsibleNoteContent content={note.content} />
                </CardContent>
            </Card>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal}
                onClose={() => setDeleteModal(false)}
                onConfirm={handleDelete}
                title="حذف الملاحظة"
                message="هل أنت متأكد من حذف هذه الملاحظة؟ لا يمكن التراجع عن هذه العملية."
                confirmText="حذف"
                cancelText="إلغاء"
                variant="danger"
            />

            {/* Share Modal */}
            <Modal
                isOpen={shareModal}
                onClose={() => {
                    setShareModal(false)
                    setCopied(false)
                }}
                title="مشاركة الملاحظة"
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            حالة المشاركة
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleTogglePublic}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                                    note.isPublic
                                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                            >
                                {note.isPublic ? (
                                    <>
                                        <Globe className="h-4 w-4" />
                                        عام
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4" />
                                        خاص
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {note.isPublic && note.shareCode && (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                رابط المشاركة
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={getShareUrl()}
                                    className="flex-1 rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm dark:border-slate-700 dark:bg-slate-800 break-all"
                                />
                                <Button
                                    onClick={handleCopyLink}
                                    variant="outline"
                                    size="sm"
                                    className="w-full sm:w-auto"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="h-4 w-4" />
                                            <span className="sm:inline">تم النسخ</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4" />
                                            <span className="sm:inline">نسخ</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                شارك هذا الرابط مع الآخرين لعرض الملاحظة
                            </p>
                        </div>
                    )}

                    {!note.isPublic && (
                        <p className="text-sm text-slate-500">
                            قم بتفعيل المشاركة العامة لعرض رابط المشاركة
                        </p>
                    )}
                </div>
            </Modal>
        </div>
    )
}

