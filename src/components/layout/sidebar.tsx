"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    MessageSquareText,
    Twitter,
    Wrench,
    BookOpen,
    Search,
    Settings,
    LogOut,
    ChevronLeft,
    Menu,
} from "lucide-react"
import { useState } from "react"
import { signOut } from "next-auth/react"

interface SidebarProps {
    workspaceName?: string
}

const navItems = [
    { icon: LayoutDashboard, label: "لوحة التحكم", href: "/dashboard" },
    { icon: MessageSquareText, label: "البروبمتات", href: "/dashboard/prompts" },
    { icon: Twitter, label: "التغريدات", href: "/dashboard/tweets" },
    { icon: Wrench, label: "الأدوات", href: "/dashboard/tools" },
    { icon: BookOpen, label: "Playbooks", href: "/dashboard/playbooks" },
    { icon: Search, label: "البحث", href: "/dashboard/search" },
    { icon: Settings, label: "الإعدادات", href: "/dashboard/settings" },
]

export function Sidebar({ workspaceName = "مساحة العمل" }: SidebarProps) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <>
            {/* Mobile overlay */}
            <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" style={{ display: "none" }} />

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed right-0 top-0 z-50 flex h-full flex-col border-l border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-950",
                    collapsed ? "w-20" : "w-64"
                )}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
                    {!collapsed && (
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
                                <span className="text-lg font-bold text-white">AI</span>
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-slate-900 dark:text-white">
                                    AI Knowledge Hub
                                </h1>
                                <p className="text-xs text-slate-500 truncate max-w-[120px]">
                                    {workspaceName}
                                </p>
                            </div>
                        </div>
                    )}

                    {collapsed && (
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
                            <span className="text-lg font-bold text-white">AI</span>
                        </div>
                    )}

                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                    >
                        <ChevronLeft className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
                                    collapsed && "justify-center"
                                )}
                            >
                                <item.icon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout */}
                <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20",
                            collapsed && "justify-center"
                        )}
                    >
                        <LogOut className="h-5 w-5" />
                        {!collapsed && <span>تسجيل الخروج</span>}
                    </button>
                </div>
            </aside>
        </>
    )
}
