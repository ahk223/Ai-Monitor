"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Modal } from "@/components/ui"
import {
    ArrowRight,
    Copy,
    Star,
    Play,
    GitBranch,
    TestTube,
    Link2,
    Activity,
    Loader2,
    Edit2,
} from "lucide-react"
import Link from "next/link"

interface Prompt {
    id: string
    title: string
    description: string | null
    content: string
    rating: number | null
    usageCount: number
    categoryId: string | null
    createdAt: Date
}

interface PromptVersion {
    id: string
    version: number
    content: string
    changeNote: string | null
    createdAt: Date
}

interface PromptTest {
    id: string
    rating: number | null
    notes: string | null
    output: string | null
    createdAt: Date
}

interface Category {
    id: string
    name: string
    color: string
}

export default function PromptDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { userData } = useAuth()
    const promptId = params.id as string

    const [prompt, setPrompt] = useState<Prompt | null>(null)
    const [versions, setVersions] = useState<PromptVersion[]>([])
    const [tests, setTests] = useState<PromptTest[]>([])
    const [category, setCategory] = useState<Category | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("overview")
    const [showTestModal, setShowTestModal] = useState(false)
    const [testRating, setTestRating] = useState(5)
    const [testNotes, setTestNotes] = useState("")
    const [testOutput, setTestOutput] = useState("")
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (promptId) {
            fetchPromptData()
        }
    }, [promptId])

    const fetchPromptData = async () => {
        try {
            // Fetch prompt
            const promptDoc = await getDoc(doc(db, "prompts", promptId))
            if (!promptDoc.exists()) {
                router.push("/dashboard/prompts")
                return
            }
            const promptData = promptDoc.data() as Prompt
            setPrompt({ ...promptData, id: promptDoc.id })

            // Fetch category
            if (promptData.categoryId) {
                const catDoc = await getDoc(doc(db, "categories", promptData.categoryId))
                if (catDoc.exists()) {
                    setCategory(catDoc.data() as Category)
                }
            }

            // Fetch versions
            const versionsQuery = query(
                collection(db, "promptVersions"),
                where("promptId", "==", promptId)
            )
            const versionsSnap = await getDocs(versionsQuery)
            const versionsList = versionsSnap.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            })) as PromptVersion[]
            versionsList.sort((a, b) => b.version - a.version)
            setVersions(versionsList)

            // Fetch tests
            const testsQuery = query(
                collection(db, "promptTests"),
                where("promptId", "==", promptId)
            )
            const testsSnap = await getDocs(testsQuery)
            const testsList = testsSnap.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            })) as PromptTest[]
            testsList.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
                const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
                return dateB.getTime() - dateA.getTime()
            })
            setTests(testsList)
        } catch (error) {
            console.error("Error fetching prompt:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = async () => {
        if (!prompt) return
        await navigator.clipboard.writeText(prompt.content)
        // Update usage count
        await updateDoc(doc(db, "prompts", promptId), {
            usageCount: (prompt.usageCount || 0) + 1,
        })
        setPrompt({ ...prompt, usageCount: (prompt.usageCount || 0) + 1 })
    }

    const handleSaveTest = async () => {
        if (!prompt) return

        setSaving(true)
        try {
            const testId = doc(collection(db, "promptTests")).id
            await setDoc(doc(db, "promptTests", testId), {
                id: testId,
                promptId,
                rating: testRating,
                notes: testNotes || null,
                output: testOutput || null,
                createdAt: new Date(),
            })

            // Calculate new average rating
            const allRatings = [...tests.map(t => t.rating).filter(Boolean), testRating]
            const avgRating = allRatings.reduce((a, b) => (a || 0) + (b || 0), 0) / allRatings.length

            await updateDoc(doc(db, "prompts", promptId), { rating: avgRating })

            setTests([{ id: testId, rating: testRating, notes: testNotes, output: testOutput, createdAt: new Date() }, ...tests])
            setPrompt({ ...prompt, rating: avgRating })
            setShowTestModal(false)
            setTestRating(5)
            setTestNotes("")
            setTestOutput("")
        } catch (error) {
            console.error("Error saving test:", error)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!prompt) {
        return null
    }

    const tabs = [
        { id: "overview", label: "نظرة عامة", icon: Activity },
        { id: "versions", label: `الإصدارات (${versions.length})`, icon: GitBranch },
        { id: "tests", label: `الاختبارات (${tests.length})`, icon: TestTube },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/prompts">
                        <Button variant="ghost" size="icon">
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {prompt.title}
                            </h1>
                            {prompt.rating && (
                                <div className="flex items-center gap-1 text-amber-500">
                                    <Star className="h-5 w-5 fill-amber-500" />
                                    <span className="font-medium">{prompt.rating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                        {prompt.description && (
                            <p className="mt-1 text-slate-500">{prompt.description}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                            {category && (
                                <Badge style={{ backgroundColor: category.color + "20", color: category.color }}>
                                    {category.name}
                                </Badge>
                            )}
                            <span className="text-sm text-slate-500">
                                استُخدم {prompt.usageCount || 0} مرة
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                        نسخ
                    </Button>
                    <Button onClick={() => setShowTestModal(true)}>
                        <TestTube className="h-4 w-4" />
                        اختبار
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === tab.id
                                ? "bg-white text-indigo-600 shadow dark:bg-slate-900"
                                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
                <Card>
                    <CardHeader>
                        <CardTitle>محتوى البروبمت</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-mono text-sm dark:bg-slate-800">
                            {prompt.content}
                        </pre>
                    </CardContent>
                </Card>
            )}

            {activeTab === "versions" && (
                <div className="space-y-4">
                    {versions.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <GitBranch className="mx-auto h-12 w-12 text-slate-300" />
                                <p className="mt-4 text-slate-500">لا توجد إصدارات سابقة</p>
                            </CardContent>
                        </Card>
                    ) : (
                        versions.map(version => (
                            <Card key={version.id}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>الإصدار {version.version}</span>
                                        <Badge variant="secondary">
                                            {version.version === versions[0].version ? "الحالي" : "سابق"}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {version.changeNote && (
                                        <p className="mb-3 text-sm text-slate-500">{version.changeNote}</p>
                                    )}
                                    <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-mono text-xs dark:bg-slate-800 max-h-40 overflow-auto">
                                        {version.content}
                                    </pre>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {activeTab === "tests" && (
                <div className="space-y-4">
                    {tests.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <TestTube className="mx-auto h-12 w-12 text-slate-300" />
                                <p className="mt-4 text-slate-500">لا توجد اختبارات بعد</p>
                                <Button className="mt-4" onClick={() => setShowTestModal(true)}>
                                    <TestTube className="h-4 w-4" />
                                    إضافة اختبار
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        tests.map(test => (
                            <Card key={test.id}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 text-amber-500">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <Star
                                                    key={i}
                                                    className={`h-5 w-5 ${i <= (test.rating || 0) ? "fill-amber-500" : "fill-slate-200"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    {test.notes && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{test.notes}</p>
                                    )}
                                    {test.output && (
                                        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-mono text-xs dark:bg-slate-800 max-h-32 overflow-auto">
                                            {test.output}
                                        </pre>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Test Modal */}
            <Modal isOpen={showTestModal} onClose={() => setShowTestModal(false)} title="إضافة اختبار">
                <div className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium">التقييم</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <button
                                    key={i}
                                    onClick={() => setTestRating(i)}
                                    className="p-1"
                                >
                                    <Star
                                        className={`h-8 w-8 transition-all ${i <= testRating ? "fill-amber-500 text-amber-500" : "fill-slate-200 text-slate-200"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium">ملاحظات</label>
                        <textarea
                            value={testNotes}
                            onChange={(e) => setTestNotes(e.target.value)}
                            placeholder="ملاحظات عن الاختبار..."
                            className="w-full rounded-xl border-2 border-slate-200 p-3 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium">المخرجات</label>
                        <textarea
                            value={testOutput}
                            onChange={(e) => setTestOutput(e.target.value)}
                            placeholder="الناتج من الاختبار..."
                            className="w-full rounded-xl border-2 border-slate-200 p-3 font-mono text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                            rows={4}
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowTestModal(false)}>
                            إلغاء
                        </Button>
                        <Button onClick={handleSaveTest} isLoading={saving}>
                            حفظ الاختبار
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
