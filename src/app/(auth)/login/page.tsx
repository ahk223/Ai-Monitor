"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button, Input, Card, CardContent } from "@/components/ui"
import { Mail, Lock, Loader2 } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
    const { signIn } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            await signIn(email, password)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "حدث خطأ"
            if (errorMessage.includes("user-not-found") || errorMessage.includes("wrong-password")) {
                setError("البريد الإلكتروني أو كلمة المرور غير صحيحة")
            } else if (errorMessage.includes("invalid-email")) {
                setError("البريد الإلكتروني غير صالح")
            } else {
                setError("حدث خطأ أثناء تسجيل الدخول")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-2xl font-bold text-white shadow-lg">
                        AI
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        AI Knowledge Hub
                    </h1>
                    <p className="mt-1 text-slate-500">سجّل دخولك للمتابعة</p>
                </div>

                <Card>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                    {error}
                                </div>
                            )}

                            <Input
                                label="البريد الإلكتروني"
                                type="email"
                                placeholder="example@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                icon={<Mail className="h-5 w-5" />}
                                required
                            />

                            <Input
                                label="كلمة المرور"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={<Lock className="h-5 w-5" />}
                                required
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                isLoading={isLoading}
                            >
                                تسجيل الدخول
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm text-slate-500">
                            ليس لديك حساب؟{" "}
                            <Link
                                href="/register"
                                className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                سجّل الآن
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
