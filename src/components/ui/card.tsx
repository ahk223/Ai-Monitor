import * as React from "react"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    gradient?: boolean
    hover?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, gradient, hover, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 w-full max-w-full min-w-0",
                gradient && "bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800",
                hover && "transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1",
                className
            )}
            {...props}
        />
    )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("mb-4 flex items-center justify-between", className)}
            {...props}
        />
    )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3
            ref={ref}
            className={cn("text-lg font-semibold text-slate-900 dark:text-white", className)}
            {...props}
        />
    )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p
            ref={ref}
            className={cn("text-sm text-slate-500 dark:text-slate-400", className)}
            {...props}
        />
    )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("", className)} {...props} />
    )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800", className)}
            {...props}
        />
    )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
