"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore"
import Link from "next/link"
import { Card, CardContent, Badge, Button } from "@/components/ui"
import { Plus, StickyNote, Trash2, Loader2, Pencil } from "lucide-react"

interface Note {
    id: string
    title: string
    content: string
    categoryId: string | null
    createdAt: Date
}

interface Category {
    id: string
    name: string
    color: string
}

export default function NotesPage() {
    const { userData } = useAuth()
    const [notes, setNotes] = useState<Note[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState<string>("")

    useEffect(() => {
        if (userData?.workspaceId) {
            fetchData()
        }
    }, [userData])

    const fetchData = async () => {
        try {
            // Fetch notes
            const notesQuery = query(
                collection(db, "notes"),
                where("workspaceId", "==", userData?.workspaceId)
            )
            const notesSnap = await getDocs(notesQuery)
            const notesList = notesSnap.docs.map(doc => ({
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as Note[]
            notesList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            setNotes(notesList)

            // Fetch categories
            const catsQuery = query(
                collection(db, "categories"),
                where("workspaceId", "==", userData?.workspaceId)
            )
            const catsSnap = await getDocs(catsQuery)
            setCategories(catsSnap.docs.map(doc => doc.data() as Category))
        } catch (error) {
            console.error("Error fetching notes:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (noteId: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه الملاحظة؟")) return

        try {
            await deleteDoc(doc(db, "notes", noteId))
            setNotes(notes.filter(n => n.id !== noteId))
        } catch (error) {
            console.error("Error deleting note:", error)
        }
    }

    const getCategoryName = (categoryId: string | null) => {
        if (!categoryId) return null
        const cat = categories.find(c => c.id === categoryId)
        return cat ? cat.name : null
    }

    const getCategoryColor = (categoryId: string | null) => {
        if (!categoryId) return "#6366f1"
        const cat = categories.find(c => c.id === categoryId)
        return cat?.color || "#6366f1"
    }

    const filteredNotes = selectedCategory
        ? notes.filter(n => n.categoryId === selectedCategory)
        : notes

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
                        الملاحظات
                    </h1>
                    <p className="mt-1 text-slate-500">
                        {notes.length} ملاحظة
                    </p>
                </div>
                <Link href="/dashboard/notes/new">
                    <Button>
                        <Plus className="h-4 w-4" />
                        إضافة ملاحظة
                    </Button>
                </Link>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory("")}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${!selectedCategory
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                    >
                        الكل
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${selectedCategory === cat.id
                                ? "text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                            style={selectedCategory === cat.id ? { backgroundColor: cat.color } : {}}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Notes Grid */}
            {filteredNotes.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <StickyNote className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-4 font-medium text-slate-900 dark:text-white">
                            لا توجد ملاحظات
                        </h3>
                        <p className="mt-1 text-slate-500">
                            ابدأ بإضافة ملاحظة جديدة
                        </p>
                        <Link href="/dashboard/notes/new">
                            <Button className="mt-4">
                                <Plus className="h-4 w-4" />
                                إضافة ملاحظة
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredNotes.map(note => (
                        <Card key={note.id} className="group relative">
                            <CardContent>
                                {getCategoryName(note.categoryId) && (
                                    <Badge
                                        className="mb-3"
                                        style={{ backgroundColor: getCategoryColor(note.categoryId) }}
                                    >
                                        {getCategoryName(note.categoryId)}
                                    </Badge>
                                )}
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                                    {note.title || "ملاحظة بدون عنوان"}
                                </h3>
                                <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-400 text-sm line-clamp-3">
                                    {note.content}
                                </p>
                                <p className="mt-3 text-xs text-slate-400">
                                    {note.createdAt.toLocaleDateString("ar-SA")}
                                </p>

                                {/* Edit and Delete buttons */}
                                <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link href={`/dashboard/notes/${note.id}/edit`}>
                                        <button
                                            className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(note.id)}
                                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
