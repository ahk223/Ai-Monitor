import { useState, useRef, useEffect } from "react"
import { Upload, X, Image as ImageIcon, Loader2, Link2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { storage, db } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { doc, collection } from "firebase/firestore"
import { Input } from "./input"
import { Button } from "./button"

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
    workspaceId?: string
}

export function ImageUpload({
    attachments,
    onUpload,
    onRemove,
    entityType,
    entityId,
    maxFiles = 5,
    workspaceId,
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [urlInput, setUrlInput] = useState("")
    const [urlLoading, setUrlLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Handle Paste Event
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (e.clipboardData?.files.length) {
                processFiles(Array.from(e.clipboardData.files))
            }
        }
        window.addEventListener("paste", handlePaste)
        return () => window.removeEventListener("paste", handlePaste)
    }, [attachments.length, maxFiles])

    const processFiles = async (files: File[]) => {
        if (!files || files.length === 0) return

        if (attachments.length + files.length > maxFiles) {
            setError(`الحد الأقصى ${maxFiles} ملفات`)
            return
        }

        setUploading(true)
        setError(null)

        for (const file of files) {
            try {
                // Validate file size (5MB max)
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error("حجم الملف كبير جداً (الحد الأقصى 5MB)")
                }

                // Validate file type
                const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]
                if (!allowedTypes.includes(file.type)) {
                    throw new Error("نوع الملف غير مدعوم")
                }

                // Generate unique ID
                const attachmentId = doc(collection(db, "attachments")).id
                const fileExtension = file.name.split('.').pop() || "png"
                const storagePath = `attachments/${workspaceId || 'default'}/${attachmentId}.${fileExtension}`

                // Upload to Firebase Storage
                const storageRef = ref(storage, storagePath)
                await uploadBytes(storageRef, file)
                const url = await getDownloadURL(storageRef)

                const attachment: Attachment = {
                    id: attachmentId,
                    url,
                    originalName: file.name,
                    mimeType: file.type,
                }

                onUpload(attachment)
            } catch (err) {
                console.error("Upload error:", err)
                setError(err instanceof Error ? err.message : "حدث خطأ")
            }
        }

        setUploading(false)
        if (inputRef.current) {
            inputRef.current.value = ""
        }
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files) {
            processFiles(Array.from(files))
        }
    }

    const handleUrlUpload = async () => {
        if (!urlInput.trim()) return

        setUrlLoading(true)
        setError(null)

        try {
            const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(urlInput.trim())}`)
            if (!res.ok) throw new Error("فشل تحميل الصورة")

            const blob = await res.blob()
            const contentType = res.headers.get("Content-Type") || "image/jpeg"
            const extension = contentType.split("/")[1] || "jpg"
            const filename = `url-image-${Date.now()}.${extension}`

            const file = new File([blob], filename, { type: contentType })
            await processFiles([file])
            setUrlInput("")
        } catch (error) {
            console.error("Url upload error:", error)
            setError("لم نتمكن من جلب الصورة من الرابط")
        } finally {
            setUrlLoading(false)
        }
    }

    const handleRemove = async (id: string) => {
        try {
            // Find the attachment
            const attachment = attachments.find(a => a.id === id)
            if (attachment) {
                // Try to delete from storage (may fail if URL format is different)
                try {
                    const storageRef = ref(storage, `attachments/${workspaceId || 'default'}/${id}`)
                    await deleteObject(storageRef)
                } catch (e) {
                    console.warn("Could not delete from storage:", e)
                }
            }
            onRemove(id)
        } catch (err) {
            console.error("Failed to delete:", err)
            onRemove(id) // Remove from UI anyway
        }
    }

    return (
        <div className="space-y-4">
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

                <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {uploading ? "جاري الرفع..." : "اضغط للرفع أو الصق الصورة (Ctrl+V)"}
                </p>
                <p className="text-xs text-slate-400">
                    يمكنك أيضاً سحب الملفات وإفلاتها هنا
                </p>
            </div>

            {/* URL Upload */}
            <div className="flex gap-2">
                <Input
                    placeholder="أو ألصق رابط صورة..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUrlUpload()}
                    className="text-sm"
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleUrlUpload}
                    disabled={!urlInput || urlLoading || uploading}
                >
                    {urlLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                </Button>
            </div>
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
