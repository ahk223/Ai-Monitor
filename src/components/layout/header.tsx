"use client"

import { Search, Bell, Plus, User, LogOut, Settings, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "next-themes"

interface HeaderProps {
    user?: { name: string | null; email: string }
}

export function Header({ user }: HeaderProps) {
    const { signOut } = useAuth()
    const { theme, setTheme } = useTheme()
    const [searchQuery, setSearchQuery] = useState("")
    const [showQuickAdd, setShowQuickAdd] = useState(false)
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [mounted, setMounted] = useState(false)
    const userName = user?.name || "مستخدم"

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleLogout = async () => {
        try {
            await signOut()
        } catch (error) {
            console.error("Error logging out:", error)
        }
    }

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark")
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 lg:px-6 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
            {/* Search - hidden on small mobile, show on medium+ */}
            <div className="relative hidden sm:block w-full max-w-md">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="ابحث في كل شيء..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-4 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900"
                />
            </div>

            {/* Mobile: Logo placeholder for spacing */}
            <div className="sm:hidden w-10" />

            {/* Actions */}
            <div className="flex items-center gap-2 lg:gap-3">
                {/* Mobile search link */}
                <Link href="/dashboard/search" className="sm:hidden">
                    <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400">
                        <Search className="h-5 w-5" />
                    </button>
                </Link>

                {/* Dark Mode Toggle */}
                {mounted && (
                    <button
                        onClick={toggleTheme}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-all hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                        title={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
                    >
                        {theme === "dark" ? (
                            <Sun className="h-5 w-5" />
                        ) : (
                            <Moon className="h-5 w-5" />
                        )}
                    </button>
                )}

                {/* Quick Add */}
                <div className="relative">
                    <Button
                        size="icon"
                        className="rounded-full"
                        onClick={() => setShowQuickAdd(!showQuickAdd)}
                    >
                        <Plus className="h-5 w-5" />
                    </Button>

                    {/* Dropdown */}
                    {showQuickAdd && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowQuickAdd(false)}
                            />
                            <div className="absolute left-0 top-full mt-2 z-50 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                                <Link
                                    href="/dashboard/prompts/new"
                                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                    onClick={() => setShowQuickAdd(false)}
                                >
                                    بروبمت جديد
                                </Link>
                                <Link
                                    href="/dashboard/tweets/new"
                                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                    onClick={() => setShowQuickAdd(false)}
                                >
                                    تغريدة جديدة
                                </Link>
                                <Link
                                    href="/dashboard/tools/new"
                                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                    onClick={() => setShowQuickAdd(false)}
                                >
                                    أداة جديدة
                                </Link>
                                <Link
                                    href="/dashboard/playbooks/new"
                                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                    onClick={() => setShowQuickAdd(false)}
                                >
                                    Playbook جديد
                                </Link>
                            </div>
                        </>
                    )}
                </div>

                {/* Notifications - hidden on very small screens */}
                <button className="hidden xs:flex relative h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-all hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        3
                    </span>
                </button>

                {/* User */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-2 lg:gap-3 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pr-1.5 pl-2 lg:pl-4 dark:border-slate-700 dark:bg-slate-900 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[80px] lg:max-w-none truncate">
                            {userName}
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                            <User className="h-4 w-4 text-white" />
                        </div>
                    </button>

                    {/* Profile Dropdown */}
                    {showProfileMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowProfileMenu(false)}
                            />
                            <div className="absolute left-0 top-full mt-2 z-50 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                                <Link
                                    href="/dashboard/settings"
                                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                    onClick={() => setShowProfileMenu(false)}
                                >
                                    <Settings className="h-4 w-4" />
                                    الإعدادات
                                </Link>
                                <button
                                    onClick={() => {
                                        setShowProfileMenu(false)
                                        handleLogout()
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                >
                                    <LogOut className="h-4 w-4" />
                                    تسجيل الخروج
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}
