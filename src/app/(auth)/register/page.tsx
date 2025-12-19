"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button, Input, Card, CardContent } from "@/components/ui"
import { Mail, Lock, User, Building } from "lucide-react"

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        workspaceName: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || "حدث خطأ أثناء التسجيل")
                return
            }

            // Redirect to login
            router.push("/login?registered=true")
        } catch {
            setError("حدث خطأ، يرجى المحاولة مرة أخرى")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4" dir="rtl">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25">
                        <span className="text-2xl font-bold text-white">AI</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        إنشاء حساب جديد
                    </h1>
                    <p className="mt-1 text-slate-500">ابدأ بإدارة معرفتك التشغيلية</p>
                </div>

                <Card gradient>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-900 dark:text-red-400">
                                    {error}
                                </div>
                            )}

                            <Input
                                label="الاسم"
                                type="text"
                                placeholder="اسمك الكامل"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                icon={<User className="h-4 w-4" />}
                                required
                            />

                            <Input
                                label="البريد الإلكتروني"
                                type="email"
                                placeholder="example@email.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                icon={<Mail className="h-4 w-4" />}
                                required
                            />

                            <Input
                                label="كلمة المرور"
                                type="password"
                                placeholder="6 أحرف على الأقل"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                icon={<Lock className="h-4 w-4" />}
                                required
                                minLength={6}
                            />

                            <Input
                                label="اسم مساحة العمل"
                                type="text"
                                placeholder="مثال: شركتي، مشاريعي..."
                                value={form.workspaceName}
                                onChange={(e) => setForm({ ...form, workspaceName: e.target.value })}
                                icon={<Building className="h-4 w-4" />}
                                required
                            />

                            <Button type="submit" className="w-full" isLoading={isLoading}>
                                {isLoading ? "جارٍ إنشاء الحساب..." : "إنشاء حساب"}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm text-slate-500">
                            لديك حساب بالفعل؟{" "}
                            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
                                سجّل دخولك
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
