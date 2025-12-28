"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import { Bold, Italic, List, ListOrdered, Undo, Redo, Type, Palette, Highlighter, Heading1, Heading2, Heading3, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "./button"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Extension } from "@tiptap/core"
import type { Editor } from "@tiptap/react"

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    placeholder?: string
    className?: string
}

// Custom FontSize extension
const FontSize = TextStyle.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            fontSize: {
                default: null,
                parseHTML: element => element.style.fontSize,
                renderHTML: attributes => {
                    if (!attributes.fontSize) {
                        return {}
                    }
                    return {
                        style: `font-size: ${attributes.fontSize}`,
                    }
                },
            },
        }
    },
    addCommands() {
        return {
            setFontSize: (fontSize: string) => ({ commands }) => {
                return commands.setMark(this.name, { fontSize })
            },
            unsetFontSize: () => ({ commands }) => {
                return commands.unsetMark(this.name)
            },
        }
    },
})

// Collapsible Heading Extension
const CollapsibleHeading = Extension.create({
    name: 'collapsibleHeading',
    
    addGlobalAttributes() {
        return [
            {
                types: ['heading'],
                attributes: {
                    collapsed: {
                        default: false,
                        parseHTML: element => element.getAttribute('data-collapsed') === 'true',
                        renderHTML: attributes => {
                            if (!attributes.collapsed) {
                                return {}
                            }
                            return {
                                'data-collapsed': 'true',
                            }
                        },
                    },
                },
            },
        ]
    },
})

// Component to handle collapsible headings
function CollapsibleHeadingsHandler({ 
    editor, 
    collapsedHeadings, 
    onToggle,
    containerRef
}: { 
    editor: Editor | null
    collapsedHeadings: Set<string>
    onToggle: (id: string) => void
    containerRef: React.RefObject<HTMLDivElement | null>
}) {
    useEffect(() => {
        if (!editor || !containerRef.current) return

        const updateHeadings = () => {
            // Use setTimeout to ensure DOM is updated after TipTap renders
            setTimeout(() => {
                const editorElement = containerRef.current?.querySelector('.ProseMirror')
                if (!editorElement) return

                const headings = Array.from(editorElement.querySelectorAll('h1, h2, h3'))
                
                headings.forEach((heading, index) => {
                    const headingElement = heading as HTMLElement
                    const headingText = headingElement.textContent?.trim() || ''
                    const headingId = `heading-${index}-${headingText.slice(0, 20).replace(/\s/g, '-')}`
                    
                    // Skip if already processed
                    if (headingElement.getAttribute('data-heading-id') === headingId && headingElement.querySelector('.heading-chevron')) {
                        // Just update collapsed state
                        const isCollapsed = collapsedHeadings.has(headingId)
                        headingElement.classList.toggle('collapsed-heading', isCollapsed)
                        
                        // Update chevron
                        const chevron = headingElement.querySelector('.heading-chevron')
                        if (chevron) {
                            chevron.innerHTML = isCollapsed
                                ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>'
                                : '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>'
                        }
                        
                        // Update visibility
                        let nextSibling = headingElement.nextElementSibling
                        while (nextSibling) {
                            const nextHeading = nextSibling.querySelector('h1, h2, h3')
                            if (nextHeading) break
                            (nextSibling as HTMLElement).style.display = isCollapsed ? 'none' : ''
                            nextSibling = nextSibling.nextElementSibling
                        }
                        return
                    }
                    
                    headingElement.setAttribute('data-heading-id', headingId)
                    
                    // Remove existing chevron
                    const existingChevron = headingElement.querySelector('.heading-chevron')
                    if (existingChevron) {
                        existingChevron.remove()
                    }
                    
                    // Add chevron
                    const chevron = document.createElement('span')
                    chevron.className = 'heading-chevron'
                    chevron.innerHTML = collapsedHeadings.has(headingId)
                        ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>'
                        : '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>'
                    headingElement.style.position = 'relative'
                    headingElement.style.paddingRight = '1.5rem'
                    headingElement.style.cursor = 'pointer'
                    headingElement.appendChild(chevron)

                    // Handle click
                    const handleClick = (e: Event) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onToggle(headingId)
                    }
                    
                    headingElement.addEventListener('click', handleClick)

                    // Hide/show content after heading
                    const isCollapsed = collapsedHeadings.has(headingId)
                    if (isCollapsed) {
                        headingElement.classList.add('collapsed-heading')
                        let nextSibling = headingElement.nextElementSibling
                        while (nextSibling) {
                            const nextHeading = nextSibling.querySelector('h1, h2, h3')
                            if (nextHeading) break
                            (nextSibling as HTMLElement).style.display = 'none'
                            nextSibling = nextSibling.nextElementSibling
                        }
                    } else {
                        headingElement.classList.remove('collapsed-heading')
                        let nextSibling = headingElement.nextElementSibling
                        while (nextSibling) {
                            const nextHeading = nextSibling.querySelector('h1, h2, h3')
                            if (nextHeading) break
                            (nextSibling as HTMLElement).style.display = ''
                            nextSibling = nextSibling.nextElementSibling
                        }
                    }
                })
            }, 150)
        }

        // Initial update
        updateHeadings()

        // Update on editor changes
        const updateHandler = () => {
            updateHeadings()
        }
        
        editor.on('update', updateHandler)
        editor.on('selectionUpdate', updateHandler)

        return () => {
            editor.off('update', updateHandler)
            editor.off('selectionUpdate', updateHandler)
        }
    }, [editor, collapsedHeadings, onToggle, containerRef])

    return null
}

export function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [showHighlightPicker, setShowHighlightPicker] = useState(false)
    const [showFontSizeMenu, setShowFontSizeMenu] = useState(false)
    const [collapsedHeadings, setCollapsedHeadings] = useState<Set<string>>(new Set())
    const [colorPickerPos, setColorPickerPos] = useState<{ bottom: number; right: number } | null>(null)
    const [highlightPickerPos, setHighlightPickerPos] = useState<{ bottom: number; right: number } | null>(null)
    const [fontSizeMenuPos, setFontSizeMenuPos] = useState<{ bottom: number; right: number } | null>(null)
    const [isMounted, setIsMounted] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const toolbarRef = useRef<HTMLDivElement>(null)
    const colorButtonRef = useRef<HTMLButtonElement>(null)
    const highlightButtonRef = useRef<HTMLButtonElement>(null)
    const fontSizeButtonRef = useRef<HTMLButtonElement>(null)

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            TextStyle,
            Color.configure({
                types: ['textStyle'],
            }),
            Highlight.configure({
                multicolor: true,
            }),
            FontSize,
            CollapsibleHeading,
        ],
        content: content || "",
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: "max-w-none focus:outline-none min-h-[200px] p-3 sm:p-4 w-full overflow-wrap break-words",
                placeholder: placeholder || "اكتب هنا...",
            },
        },
    })

    // Toggle heading collapse
    const toggleHeadingCollapse = (headingId: string) => {
        setCollapsedHeadings(prev => {
            const newSet = new Set(prev)
            if (newSet.has(headingId)) {
                newSet.delete(headingId)
            } else {
                newSet.add(headingId)
            }
            return newSet
        })
    }

    // Ensure component is mounted on client
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Make toolbar sticky on scroll - using CSS sticky should work, but ensure it's applied
    useEffect(() => {
        if (!toolbarRef.current) return
        
        // Force sticky positioning
        const toolbar = toolbarRef.current
        toolbar.style.position = 'sticky'
        toolbar.style.top = '0'
        toolbar.style.zIndex = '30'
    }, [])

    // Calculate dropdown positions when they open
    useEffect(() => {
        if (showColorPicker && colorButtonRef.current) {
            const rect = colorButtonRef.current.getBoundingClientRect()
            setColorPickerPos({
                bottom: window.innerHeight - rect.top + 4,
                right: window.innerWidth - rect.right,
            })
        } else {
            setColorPickerPos(null)
        }
    }, [showColorPicker])

    useEffect(() => {
        if (showHighlightPicker && highlightButtonRef.current) {
            const rect = highlightButtonRef.current.getBoundingClientRect()
            setHighlightPickerPos({
                bottom: window.innerHeight - rect.top + 4,
                right: window.innerWidth - rect.right,
            })
        } else {
            setHighlightPickerPos(null)
        }
    }, [showHighlightPicker])

    useEffect(() => {
        if (showFontSizeMenu && fontSizeButtonRef.current) {
            const rect = fontSizeButtonRef.current.getBoundingClientRect()
            setFontSizeMenuPos({
                bottom: window.innerHeight - rect.top + 4,
                right: window.innerWidth - rect.right,
            })
        } else {
            setFontSizeMenuPos(null)
        }
    }, [showFontSizeMenu])

    if (!editor) {
        return null
    }

    return (
        <div ref={containerRef} className={`border-2 border-slate-200 rounded-xl bg-white dark:border-slate-700 dark:bg-slate-900 ${className || ""} relative w-full max-w-full min-w-0 flex flex-col`} style={{ maxWidth: '100%' }}>
            {/* Toolbar - Sticky at top */}
            <div 
                ref={toolbarRef}
                className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1 p-1.5 sm:p-2 flex-nowrap rounded-t-xl shadow-md overflow-x-auto overflow-y-visible"
            >
                {/* Headings */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={editor.isActive("heading", { level: 1 }) ? "bg-slate-100 dark:bg-slate-800" : ""}
                    title="عنوان رئيسي"
                >
                    <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive("heading", { level: 2 }) ? "bg-slate-100 dark:bg-slate-800" : ""}
                    title="عنوان فرعي"
                >
                    <Heading2 className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={editor.isActive("heading", { level: 3 }) ? "bg-slate-100 dark:bg-slate-800" : ""}
                    title="عنوان صغير"
                >
                    <Heading3 className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                
                {/* Text Formatting */}
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
                
                {/* Font Size */}
                <div className="relative">
                    <Button
                        ref={fontSizeButtonRef}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setShowFontSizeMenu(!showFontSizeMenu)
                            setShowColorPicker(false)
                            setShowHighlightPicker(false)
                        }}
                        className={showFontSizeMenu ? "bg-slate-100 dark:bg-slate-800" : ""}
                        title="حجم الخط"
                    >
                        <Type className="h-4 w-4" />
                    </Button>
                    {showFontSizeMenu && fontSizeMenuPos && isMounted && createPortal(
                        <div 
                            className="fixed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-[100] p-2 min-w-[120px] max-w-[calc(100vw-2rem)]"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                bottom: `${fontSizeMenuPos.bottom}px`,
                                right: `${fontSizeMenuPos.right}px`,
                            }}
                        >
                            {["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"].map((size) => (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => {
                                        editor.chain().focus().setFontSize(size).run()
                                        setShowFontSizeMenu(false)
                                    }}
                                    className="w-full text-right px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                                >
                                    {size}
                                </button>
                            ))}
                        </div>,
                        document.body
                    )}
                </div>
                
                {/* Text Color */}
                <div className="relative">
                    <Button
                        ref={colorButtonRef}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setShowColorPicker(!showColorPicker)
                            setShowHighlightPicker(false)
                            setShowFontSizeMenu(false)
                        }}
                        className={showColorPicker ? "bg-slate-100 dark:bg-slate-800" : ""}
                        title="لون النص"
                    >
                        <Palette className="h-4 w-4" />
                    </Button>
                    {showColorPicker && colorPickerPos && isMounted && createPortal(
                        <div 
                            className="fixed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-[100] p-2 min-w-[180px] max-w-[calc(100vw-2rem)] sm:max-w-none"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                bottom: `${colorPickerPos.bottom}px`,
                                right: `${colorPickerPos.right}px`,
                            }}
                        >
                            <div className="grid grid-cols-5 gap-2">
                                {["#000000", "#374151", "#6B7280", "#9CA3AF", "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"].map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            // Apply color to selected text or current position
                                            if (!editor) return
                                            
                                            const { from, to } = editor.state.selection
                                            if (from !== to) {
                                                // Text is selected, apply color to selection
                                                // Use setTextSelection to maintain selection, then setColor
                                                editor.chain()
                                                    .setTextSelection({ from, to })
                                                    .focus()
                                                    .setColor(color)
                                                    .run()
                                            } else {
                                                // No selection, apply color to next typed text
                                                editor.chain().focus().setColor(color).run()
                                            }
                                            setShowColorPicker(false)
                                        }}
                                        className="w-8 h-8 rounded border-2 border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    editor.chain().focus().unsetColor().run()
                                    setShowColorPicker(false)
                                }}
                                className="w-full mt-2 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                            >
                                إزالة اللون
                            </button>
                        </div>,
                        document.body
                    )}
                </div>
                
                {/* Highlight Color */}
                <div className="relative">
                    <Button
                        ref={highlightButtonRef}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setShowHighlightPicker(!showHighlightPicker)
                            setShowColorPicker(false)
                            setShowFontSizeMenu(false)
                        }}
                        className={editor.isActive("highlight") || showHighlightPicker ? "bg-slate-100 dark:bg-slate-800" : ""}
                        title="تظليل النص"
                    >
                        <Highlighter className="h-4 w-4" />
                    </Button>
                    {showHighlightPicker && highlightPickerPos && isMounted && createPortal(
                        <div 
                            className="fixed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-[100] p-2 min-w-[180px] max-w-[calc(100vw-2rem)] sm:max-w-none"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                bottom: `${highlightPickerPos.bottom}px`,
                                right: `${highlightPickerPos.right}px`,
                            }}
                        >
                            <div className="grid grid-cols-5 gap-2">
                                {["#FEF08A", "#FDE047", "#FCD34D", "#FBBF24", "#FED7AA", "#FCA5A5", "#F9A8D4", "#C4B5FD", "#A5B4FC", "#93C5FD"].map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => {
                                            editor.chain().focus().toggleHighlight({ color }).run()
                                            setShowHighlightPicker(false)
                                        }}
                                        className="w-8 h-8 rounded border-2 border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    editor.chain().focus().unsetHighlight().run()
                                    setShowHighlightPicker(false)
                                }}
                                className="w-full mt-2 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                            >
                                إزالة التظليل
                            </button>
                        </div>,
                        document.body
                    )}
                </div>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                
                {/* Lists */}
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
                
                {/* Undo/Redo */}
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
            <div className="min-h-[200px] relative w-full min-w-0 max-w-full overflow-x-hidden" id="rich-text-editor-container">
                <div className="w-full min-w-0 max-w-full overflow-x-hidden">
                    <EditorContent editor={editor} />
                </div>
                {!content && placeholder && (
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 pointer-events-none text-sm sm:text-base">
                        {placeholder}
                    </div>
                )}
                {/* Collapsible Headings Handler */}
                <CollapsibleHeadingsHandler 
                    editor={editor} 
                    collapsedHeadings={collapsedHeadings} 
                    onToggle={toggleHeadingCollapse}
                    containerRef={containerRef}
                />
            </div>
            
            {/* Click outside to close menus - backdrop behind dropdowns */}
            {(showColorPicker || showHighlightPicker || showFontSizeMenu) && (
                <div 
                    className="fixed inset-0 z-[90] pointer-events-auto" 
                    onClick={() => {
                        setShowColorPicker(false)
                        setShowHighlightPicker(false)
                        setShowFontSizeMenu(false)
                    }}
                    style={{ backgroundColor: 'transparent' }}
                />
            )}
        </div>
    )
}

