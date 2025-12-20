"use client"

import { useState, useRef } from "react"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Attachment {
    id: string
    url: string
    originalName: string
    mimeType: string
}

interface ImageUploadProps {
    attachments: Attachment[]
    onUpload: (attachment: Attachment) => void
    onRemove: (id: string) => void
    entityType: "prompt" | "tweet" | "tool"
    entityId?: string
    maxFiles?: number
}

export function ImageUpload({
    attachments,
    onUpload,
    onRemove,
    entityType,
    entityId,
    maxFiles = 5,
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        if (attachments.length + files.length > maxFiles) {
            setError(`الحد الأقصى ${maxFiles} ملفات`)
            return
        }

        setUploading(true)
        setError(null)

        for (const file of Array.from(files)) {
            try {
                const formData = new FormData()
                formData.append("file", file)
                if (entityId) {
                    formData.append(`${entityType}Id`, entityId)
                }

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                })

                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || "فشل رفع الملف")
                }

                const attachment = await res.json()
                onUpload(attachment)
            } catch (err) {
                setError(err instanceof Error ? err.message : "حدث خطأ")
            }
        }

        setUploading(false)
        if (inputRef.current) {
            inputRef.current.value = ""
        }
    }

    const handleRemove = async (id: string) => {
        try {
            await fetch(`/api/upload?id=${id}`, { method: "DELETE" })
            onRemove(id)
        } catch (err) {
            console.error("Failed to delete:", err)
        }
    }

    return (
        <div className="space-y-3">
            {/* Upload Area */}
            <div
                onClick={() => inputRef.current?.click()}
                className={cn(
                    "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all cursor-pointer",
                    "border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50",
                    "dark:border-slate-700 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/20",
                    uploading && "pointer-events-none opacity-50"
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    onChange={handleUpload}
                    className="hidden"
                />

                {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                ) : (
                    <Upload className="h-8 w-8 text-slate-400" />
                )}

                <p className="mt-2 text-sm text-slate-500">
                    {uploading ? "جاري الرفع..." : "اضغط لرفع صور أو ملفات"}
                </p>
                <p className="text-xs text-slate-400">
                    JPG, PNG, GIF, WebP, PDF - حد أقصى 5MB
                </p>
            </div>

            {/* Error */}
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {/* Attachments Preview */}
            {attachments.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                        >
                            {attachment.mimeType.startsWith("image/") ? (
                                <img
                                    src={attachment.url}
                                    alt={attachment.originalName}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full flex-col items-center justify-center p-2">
                                    <ImageIcon className="h-8 w-8 text-slate-400" />
                                    <p className="mt-1 truncate text-xs text-slate-500">
                                        {attachment.originalName}
                                    </p>
                                </div>
                            )}

                            {/* Remove Button */}
                            <button
                                onClick={() => handleRemove(attachment.id)}
                                className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
