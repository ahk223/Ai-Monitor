"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { Sidebar } from "@/components/layout"
import { Header } from "@/components/layout"
import { Loader2 } from "lucide-react"

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { user, userData, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login")
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!user || !userData) {
        return null
    }

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900" dir="rtl">
            <Sidebar />
            <div className="flex flex-1 flex-col lg:mr-64 min-w-0 overflow-hidden">
                <Header user={{ name: userData.name, email: userData.email }} />
                <main className="flex-1 p-2 sm:p-3 md:p-4 lg:p-6 min-w-0 overflow-x-hidden">
                    <div className="w-full max-w-full min-w-0">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default function DashboardLayoutWrapper({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <DashboardContent>
            {children}
        </DashboardContent>
    )
}
