import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
            {/* Sidebar */}
            <Sidebar workspaceName={session.user.workspaceName} />

            {/* Main Content */}
            <div className="lg:mr-64">
                <Header userName={session.user.name || undefined} />

                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
