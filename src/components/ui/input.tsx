import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, icon, ...props }, ref) => {
        return (
            <div className="w-full min-w-0">
                {label && (
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                            {icon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            "flex h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm transition-all duration-200",
                            "placeholder:text-slate-400",
                            "focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
                            icon && "pr-10",
                            error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="mt-1 text-sm text-red-500">{error}</p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
