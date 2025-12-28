"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import { Bold, Italic, List, ListOrdered, Undo, Redo } from "lucide-react"
import { Button } from "./button"

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    placeholder?: string
    className?: string
}

export function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            Color,
        ],
        content: content || "",
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4",
                placeholder: placeholder || "اكتب هنا...",
            },
        },
    })

    if (!editor) {
        return null
    }

    return (
        <div className={`border-2 border-slate-200 rounded-xl bg-white dark:border-slate-700 dark:bg-slate-900 ${className || ""}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 flex-wrap">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive("bold") ? "bg-slate-100 dark:bg-slate-800" : ""}
                    title="عريض"
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive("italic") ? "bg-slate-100 dark:bg-slate-800" : ""}
                    title="مائل"
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive("bulletList") ? "bg-slate-100 dark:bg-slate-800" : ""}
                    title="قائمة نقطية"
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive("orderedList") ? "bg-slate-100 dark:bg-slate-800" : ""}
                    title="قائمة مرقمة"
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="تراجع"
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="إعادة"
                >
                    <Redo className="h-4 w-4" />
                </Button>
            </div>
            
            {/* Editor */}
            <div className="min-h-[200px] relative">
                <EditorContent editor={editor} />
                {!content && placeholder && (
                    <div className="absolute top-4 right-4 text-slate-400 pointer-events-none">
                        {placeholder}
                    </div>
                )}
            </div>
        </div>
    )
}

