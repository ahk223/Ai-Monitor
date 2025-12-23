"use client"

import { Modal } from "./modal"
import { Button } from "./button"
import { AlertTriangle } from "lucide-react"

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: "danger" | "warning" | "info"
    isLoading?: boolean
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "تأكيد",
    cancelText = "إلغاء",
    variant = "danger",
    isLoading = false,
}: ConfirmModalProps) {
    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

    const colors = {
        danger: "text-red-600",
        warning: "text-amber-600",
        info: "text-blue-600",
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="space-y-4">
                <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 ${colors[variant]}`}>
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{message}</p>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        isLoading={isLoading}
                        className={variant === "danger" ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

