"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button, Input, Card, CardContent } from "@/components/ui"
import { Mail, Lock, Loader2 } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [form, setForm] = useState({
        email: "",
        password: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const result = await signIn("credentials", {
                email: form.email,
                password: form.password,
                redirect: false,
            })

            if (result?.error) {
                setError("البريد الإلكتروني أو كلمة المرور غير صحيحة")
            } else {
                router.push("/dashboard")
                router.refresh()
            }
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
                        AI Knowledge Hub
                    </h1>
                    <p className="mt-1 text-slate-500">سجّل دخولك للمتابعة</p>
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
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                icon={<Lock className="h-4 w-4" />}
                                required
                            />

                            <Button type="submit" className="w-full" isLoading={isLoading}>
                                {isLoading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm text-slate-500">
                            ليس لديك حساب؟{" "}
                            <Link href="/register" className="font-medium text-indigo-600 hover:underline">
                                سجّل الآن
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
