"use client"

import { Search, Bell, Plus, User } from "lucide-react"
import { Button } from "@/components/ui"
import { useState } from "react"
import Link from "next/link"

interface HeaderProps {
    userName?: string
}

export function Header({ userName = "مستخدم" }: HeaderProps) {
    const [searchQuery, setSearchQuery] = useState("")

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
            {/* Search */}
            <div className="relative w-full max-w-md">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="ابحث في كل شيء..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-4 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                {/* Quick Add */}
                <div className="relative group">
                    <Button size="icon" className="rounded-full">
                        <Plus className="h-5 w-5" />
                    </Button>

                    {/* Dropdown */}
                    <div className="absolute left-0 top-full mt-2 hidden w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl group-hover:block dark:border-slate-700 dark:bg-slate-900">
                        <Link
                            href="/dashboard/prompts/new"
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            بروبمت جديد
                        </Link>
                        <Link
                            href="/dashboard/tweets/new"
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            تغريدة جديدة
                        </Link>
                        <Link
                            href="/dashboard/tools/new"
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            أداة جديدة
                        </Link>
                        <Link
                            href="/dashboard/playbooks/new"
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Playbook جديد
                        </Link>
                    </div>
                </div>

                {/* Notifications */}
                <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-all hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        3
                    </span>
                </button>

                {/* User */}
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pr-1.5 pl-4 dark:border-slate-700 dark:bg-slate-900">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {userName}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                        <User className="h-4 w-4 text-white" />
                    </div>
                </div>
            </div>
        </header>
    )
}
