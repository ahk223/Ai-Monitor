"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button, Card, CardContent, Badge, Modal, Textarea, Input } from "@/components/ui"
import {
    ArrowRight,
    Copy,
    Edit,
    Trash2,
    Star,
    Clock,
    FileText,
    History,
    TestTube,
    Link2,
    Activity,
    Wand2,
    CheckCircle2,
    XCircle,
    Play,
} from "lucide-react"
import { formatRelativeTime, formatDate, replaceVariables } from "@/lib/utils"

interface PromptDetail {
    id: string
    title: string
    description: string | null
    content: string
    rating: number | null
    usageCount: number
    createdAt: string
    updatedAt: string
    category: { id: string; name: string; color: string } | null
    tags: { id: string; name: string }[]
    versions: { id: string; version: number; content: string; changeNote: string | null; createdAt: string }[]
    variables: { id: string; name: string; description: string | null; defaultValue: string | null }[]
    tests: { id: string; input: string | null; output: string; isSuccess: boolean; rating: number | null; notes: string | null; model: string | null; createdAt: string }[]
    linkedTweets: { id: string; content: string }[]
    linkedTools: { id: string; name: string }[]
    usageLogs: { id: string; context: string | null; wasHelpful: boolean | null; createdAt: string }[]
}

type Tab = "overview" | "versions" | "tests" | "links" | "activity"

export default function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [prompt, setPrompt] = useState<PromptDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<Tab>("overview")
    const [showTestModal, setShowTestModal] = useState(false)
    const [showTryModal, setShowTryModal] = useState(false)
    const [variableValues, setVariableValues] = useState<Record<string, string>>({})
    const [testForm, setTestForm] = useState({
        output: "",
        isSuccess: true,
        rating: 5,
        notes: "",
        model: "",
    })

    useEffect(() => {
        fetchPrompt()
    }, [id])

    const fetchPrompt = async () => {
        try {
            const res = await fetch(`/api/prompts/${id}`)
            if (res.ok) {
                const data = await res.json()
                setPrompt(data)
                // Initialize variable values
                const vars: Record<string, string> = {}
                data.variables.forEach((v: { name: string; defaultValue: string | null }) => {
                    vars[v.name] = v.defaultValue || ""
                })
                setVariableValues(vars)
            } else {
                router.push("/dashboard/prompts")
            }
        } catch (error) {
            console.error("Failed to fetch prompt:", error)
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = async (content: string) => {
        await navigator.clipboard.writeText(content)
    }

    const deletePrompt = async () => {
        if (!confirm("هل أنت متأكد من حذف هذا البروبمت؟")) return
        try {
            await fetch(`/api/prompts/${id}`, { method: "DELETE" })
            router.push("/dashboard/prompts")
        } catch (error) {
            console.error("Failed to delete prompt:", error)
        }
    }

    const addTest = async () => {
        try {
            const res = await fetch(`/api/prompts/${id}/tests`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(testForm),
            })
            if (res.ok) {
                setShowTestModal(false)
                setTestForm({ output: "", isSuccess: true, rating: 5, notes: "", model: "" })
                fetchPrompt()
            }
        } catch (error) {
            console.error("Failed to add test:", error)
        }
    }

    const tabs = [
        { id: "overview" as Tab, label: "نظرة عامة", icon: FileText },
        { id: "versions" as Tab, label: `الإصدارات (${prompt?.versions.length || 0})`, icon: History },
        { id: "tests" as Tab, label: `الاختبارات (${prompt?.tests.length || 0})`, icon: TestTube },
        { id: "links" as Tab, label: "الروابط", icon: Link2 },
        { id: "activity" as Tab, label: "النشاط", icon: Activity },
    ]

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
        )
    }

    if (!prompt) return null

    const filledContent = replaceVariables(prompt.content, variableValues)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/prompts">
                        <Button variant="ghost" size="icon">
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {prompt.title}
                        </h1>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                            {prompt.category && (
                                <Badge style={{ backgroundColor: prompt.category.color + "20", color: prompt.category.color }}>
                                    {prompt.category.name}
                                </Badge>
                            )}
                            {prompt.rating && (
                                <span className="flex items-center gap-1 text-amber-500">
                                    <Star className="h-4 w-4 fill-amber-500" />
                                    {prompt.rating.toFixed(1)}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatRelativeTime(prompt.updatedAt)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowTryModal(true)}>
                        <Play className="h-4 w-4" />
                        تجربة
                    </Button>
                    <Button variant="outline" onClick={() => copyToClipboard(prompt.content)}>
                        <Copy className="h-4 w-4" />
                        نسخ
                    </Button>
                    <Link href={`/dashboard/prompts/${id}/edit`}>
                        <Button variant="outline">
                            <Edit className="h-4 w-4" />
                            تعديل
                        </Button>
                    </Link>
                    <Button variant="destructive" onClick={deletePrompt}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === tab.id
                                ? "bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white"
                                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        {prompt.description && (
                            <Card>
                                <CardContent>
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">الوصف</h3>
                                    <p className="text-slate-600 dark:text-slate-400">{prompt.description}</p>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardContent>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">محتوى البروبمت</h3>
                                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(prompt.content)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                                <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-700 font-mono dark:bg-slate-800 dark:text-slate-300">
                                    {prompt.content}
                                </pre>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {prompt.variables.length > 0 && (
                            <Card>
                                <CardContent>
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Wand2 className="h-4 w-4 text-indigo-600" />
                                        المتغيرات
                                    </h3>
                                    <div className="space-y-2">
                                        {prompt.variables.map((v) => (
                                            <div key={v.id} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                                                <code className="text-sm font-medium text-indigo-600">{`{{${v.name}}}`}</code>
                                                {v.description && (
                                                    <p className="text-xs text-slate-500 mt-1">{v.description}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardContent>
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">الإحصائيات</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">مرات الاستخدام</span>
                                        <span className="font-medium">{prompt.usageCount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">الإصدارات</span>
                                        <span className="font-medium">{prompt.versions.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">الاختبارات</span>
                                        <span className="font-medium">{prompt.tests.length}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">إضافة اختبار</h3>
                                </div>
                                <Button onClick={() => setShowTestModal(true)} className="w-full">
                                    <TestTube className="h-4 w-4" />
                                    إضافة نتيجة اختبار
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === "versions" && (
                <Card>
                    <CardContent>
                        {prompt.versions.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">لا توجد إصدارات</p>
                        ) : (
                            <div className="space-y-4">
                                {prompt.versions.map((version, i) => (
                                    <div
                                        key={version.id}
                                        className={`rounded-xl border p-4 ${i === 0 ? "border-indigo-200 bg-indigo-50/50 dark:border-indigo-900 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-700"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">v{version.version}</span>
                                                {i === 0 && <Badge variant="success">الحالي</Badge>}
                                            </div>
                                            <span className="text-sm text-slate-500">{formatDate(version.createdAt)}</span>
                                        </div>
                                        {version.changeNote && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{version.changeNote}</p>
                                        )}
                                        <pre className="whitespace-pre-wrap rounded-lg bg-white p-3 text-xs text-slate-600 font-mono dark:bg-slate-800 dark:text-slate-400 max-h-40 overflow-y-auto">
                                            {version.content}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {activeTab === "tests" && (
                <Card>
                    <CardContent>
                        {prompt.tests.length === 0 ? (
                            <div className="text-center py-8">
                                <TestTube className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                                <p className="text-slate-500">لا توجد اختبارات بعد</p>
                                <Button className="mt-4" onClick={() => setShowTestModal(true)}>
                                    إضافة أول اختبار
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {prompt.tests.map((test) => (
                                    <div key={test.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                {test.isSuccess ? (
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-red-600" />
                                                )}
                                                <span className="font-medium">{test.isSuccess ? "ناجح" : "فاشل"}</span>
                                                {test.rating && (
                                                    <span className="flex items-center gap-1 text-amber-500">
                                                        <Star className="h-4 w-4 fill-amber-500" />
                                                        {test.rating}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm text-slate-500">{formatDate(test.createdAt)}</span>
                                        </div>
                                        {test.model && (
                                            <Badge variant="secondary" className="mb-2">{test.model}</Badge>
                                        )}
                                        <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800 max-h-40 overflow-y-auto">
                                            {test.output}
                                        </pre>
                                        {test.notes && (
                                            <p className="mt-2 text-sm text-slate-500">{test.notes}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {activeTab === "links" && (
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardContent>
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">التغريدات المرتبطة</h3>
                            {prompt.linkedTweets.length === 0 ? (
                                <p className="text-sm text-slate-500">لا توجد تغريدات مرتبطة</p>
                            ) : (
                                <div className="space-y-2">
                                    {prompt.linkedTweets.map((tweet) => (
                                        <Link
                                            key={tweet.id}
                                            href={`/dashboard/tweets/${tweet.id}`}
                                            className="block rounded-lg border border-slate-200 p-3 hover:border-indigo-300 dark:border-slate-700"
                                        >
                                            <p className="text-sm line-clamp-2">{tweet.content}</p>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">الأدوات المرتبطة</h3>
                            {prompt.linkedTools.length === 0 ? (
                                <p className="text-sm text-slate-500">لا توجد أدوات مرتبطة</p>
                            ) : (
                                <div className="space-y-2">
                                    {prompt.linkedTools.map((tool) => (
                                        <Link
                                            key={tool.id}
                                            href={`/dashboard/tools/${tool.id}`}
                                            className="block rounded-lg border border-slate-200 p-3 hover:border-indigo-300 dark:border-slate-700"
                                        >
                                            <p className="font-medium">{tool.name}</p>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === "activity" && (
                <Card>
                    <CardContent>
                        {prompt.usageLogs.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">لا يوجد نشاط بعد</p>
                        ) : (
                            <div className="space-y-3">
                                {prompt.usageLogs.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                                        <div>
                                            <span className="font-medium">تم الاستخدام</span>
                                            {log.context && <span className="text-sm text-slate-500 mr-2">في {log.context}</span>}
                                        </div>
                                        <span className="text-sm text-slate-500">{formatRelativeTime(log.createdAt)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Add Test Modal */}
            <Modal isOpen={showTestModal} onClose={() => setShowTestModal(false)} title="إضافة نتيجة اختبار" size="lg">
                <div className="space-y-4">
                    <Textarea
                        label="النتيجة"
                        placeholder="ألصق نتيجة الاختبار هنا..."
                        value={testForm.output}
                        onChange={(e) => setTestForm({ ...testForm, output: e.target.value })}
                    />

                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                checked={testForm.isSuccess}
                                onChange={() => setTestForm({ ...testForm, isSuccess: true })}
                                className="h-4 w-4 text-indigo-600"
                            />
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ناجح
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                checked={!testForm.isSuccess}
                                onChange={() => setTestForm({ ...testForm, isSuccess: false })}
                                className="h-4 w-4 text-indigo-600"
                            />
                            <XCircle className="h-4 w-4 text-red-600" />
                            فاشل
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="النموذج المستخدم"
                            placeholder="مثال: GPT-4, Claude..."
                            value={testForm.model}
                            onChange={(e) => setTestForm({ ...testForm, model: e.target.value })}
                        />
                        <div>
                            <label className="mb-2 block text-sm font-medium">التقييم</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setTestForm({ ...testForm, rating: n })}
                                        className="p-1"
                                    >
                                        <Star
                                            className={`h-6 w-6 ${n <= testForm.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Textarea
                        label="ملاحظات"
                        placeholder="ملاحظات إضافية..."
                        value={testForm.notes}
                        onChange={(e) => setTestForm({ ...testForm, notes: e.target.value })}
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setShowTestModal(false)}>
                            إلغاء
                        </Button>
                        <Button onClick={addTest}>
                            حفظ
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Try Modal */}
            <Modal isOpen={showTryModal} onClose={() => setShowTryModal(false)} title="تجربة البروبمت" size="xl">
                <div className="grid gap-6 md:grid-cols-2">
                    {prompt.variables.length > 0 && (
                        <div>
                            <h4 className="font-medium mb-3">املأ المتغيرات</h4>
                            <div className="space-y-3">
                                {prompt.variables.map((v) => (
                                    <Input
                                        key={v.id}
                                        label={v.name}
                                        placeholder={v.defaultValue || `قيمة ${v.name}`}
                                        value={variableValues[v.name] || ""}
                                        onChange={(e) => setVariableValues({ ...variableValues, [v.name]: e.target.value })}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    <div className={prompt.variables.length === 0 ? "md:col-span-2" : ""}>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">البروبمت الجاهز</h4>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(filledContent)}>
                                <Copy className="h-4 w-4" />
                                نسخ
                            </Button>
                        </div>
                        <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm font-mono dark:bg-slate-800 max-h-[400px] overflow-y-auto">
                            {filledContent}
                        </pre>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
