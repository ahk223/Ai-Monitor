"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {label}
                    </label>
                )}
                <textarea
                    className={cn(
                        "flex min-h-[120px] w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm transition-all duration-200",
                        "placeholder:text-slate-400 resize-none",
                        "focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-red-500">{error}</p>
                )}
            </div>
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea }
