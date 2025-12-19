"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    size?: "sm" | "md" | "lg" | "xl"
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }

        if (isOpen) {
            document.addEventListener("keydown", handleEscape)
            document.body.style.overflow = "hidden"
        }

        return () => {
            document.removeEventListener("keydown", handleEscape)
            document.body.style.overflow = "unset"
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const sizes = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={cn(
                    "relative w-full mx-4 rounded-2xl bg-white shadow-2xl dark:bg-slate-900",
                    "animate-in fade-in-0 zoom-in-95 duration-200",
                    sizes[size]
                )}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="px-6 py-4">{children}</div>
            </div>
        </div>
    )
}
