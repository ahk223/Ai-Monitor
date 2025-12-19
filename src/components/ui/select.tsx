"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
    options: { value: string; label: string }[]
    placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, options, placeholder, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {label}
                    </label>
                )}
                <select
                    className={cn(
                        "flex h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm transition-all duration-200",
                        "focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
                        className
                    )}
                    ref={ref}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <p className="mt-1 text-sm text-red-500">{error}</p>
                )}
            </div>
        )
    }
)
Select.displayName = "Select"

export { Select }
