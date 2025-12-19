import * as React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: "default" | "secondary" | "success" | "warning" | "danger"
    size?: "sm" | "md"
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = "default", size = "md", ...props }, ref) => {
        const variants = {
            default: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
            secondary: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
            success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
            warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
            danger: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
        }

        const sizes = {
            sm: "px-2 py-0.5 text-xs",
            md: "px-2.5 py-1 text-xs",
        }

        return (
            <span
                ref={ref}
                className={cn(
                    "inline-flex items-center rounded-full font-medium",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        )
    }
)
Badge.displayName = "Badge"

export { Badge }
