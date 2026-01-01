"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import { Bold, Italic, List, ListOrdered, Undo, Redo, Type, Heading1, Heading2, Heading3, ChevronDown, ChevronRight, Palette, Highlighter, AlignLeft, AlignRight } from "lucide-react"
import { Button } from "./button"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Extension } from "@tiptap/core"
import type { Editor } from "@tiptap/react"

// Custom Text Direction extension
const TextDirection = Extension.create({
    name: 'textDirection',

    addGlobalAttributes() {
        return [
            {
                types: ['paragraph', 'heading', 'listItem'],
                attributes: {
                    dir: {
                        default: 'rtl',
                        parseHTML: (element: HTMLElement) => element.getAttribute('dir') || 'rtl',
                        renderHTML: (attributes: { dir?: string }) => {
                            if (!attributes.dir) {
                                return {}
                            }
                            return {
                                dir: attributes.dir,
                            }
                        },
                    },
                },
            },
        ]
    },

    addCommands() {
        return {
            setTextDirection: (direction: 'auto' | 'rtl' | 'ltr') => ({ commands }) => {
                return commands.updateAttributes('paragraph', { dir: direction })
                    || commands.updateAttributes('heading', { dir: direction })
                    || commands.updateAttributes('listItem', { dir: direction })
            },
        }
    },
})

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
    const [showFontSizeMenu, setShowFontSizeMenu] = useState(false)
    const [collapsedHeadings, setCollapsedHeadings] = useState<Set<string>>(new Set())
    const [fontSizeMenuPos, setFontSizeMenuPos] = useState<{ bottom: number; right: number } | null>(null)
    const [floatingToolbarPos, setFloatingToolbarPos] = useState<{ top: number; left: number } | null>(null)
    const [showFloatingToolbar, setShowFloatingToolbar] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [colorPickerType, setColorPickerType] = useState<'text' | 'highlight' | null>(null)
    const [colorPickerPos, setColorPickerPos] = useState<{ top: number; left: number } | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const toolbarRef = useRef<HTMLDivElement>(null)
    const fontSizeButtonRef = useRef<HTMLButtonElement>(null)
    const colorButtonRef = useRef<HTMLButtonElement>(null)
    const highlightButtonRef = useRef<HTMLButtonElement>(null)
    const colorPickerRef = useRef<HTMLDivElement>(null)
    const isOpeningColorPicker = useRef(false)
    const isInternalUpdate = useRef(false)

    // Function to clean HTML by removing trailing empty paragraphs
    const cleanHTML = (html: string): string => {
        if (!html || html.trim() === '') return ''
        
        // Remove trailing empty paragraphs and breaks
        // Match empty paragraphs, breaks, and whitespace at the end
        let cleaned = html.trim()
        
        // Remove trailing empty paragraphs (<p></p>, <p><br></p>, <p>&nbsp;</p>, etc.)
        cleaned = cleaned.replace(/(<p[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/p>\s*)+$/gi, '')
        
        // Also handle cases with just <br> tags at the end
        cleaned = cleaned.replace(/(<br\s*\/?>\s*)+$/gi, '')
        
        // Remove any remaining trailing whitespace
        cleaned = cleaned.trim()
        
        return cleaned
    }

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
            FontSize,
            TextDirection,
            CollapsibleHeading,
        ],
        content: content || "",
        onUpdate: ({ editor }) => {
            isInternalUpdate.current = true
            const rawHTML = editor.getHTML()
            const cleanedHTML = cleanHTML(rawHTML)
            onChange(cleanedHTML)
            // Reset flag after a short delay to allow state updates
            setTimeout(() => {
                isInternalUpdate.current = false
            }, 0)
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

    // Clean content when it changes from outside (not from internal editor updates)
    useEffect(() => {
        if (!editor || isInternalUpdate.current) return
        
        const cleanedContent = cleanHTML(content || "")
        const currentContent = cleanHTML(editor.getHTML() || "")
        
        // Only update if content actually changed (to avoid infinite loops)
        if (cleanedContent !== currentContent) {
            editor.commands.setContent(cleanedContent, { emitUpdate: false })
        }
    }, [content, editor])

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

    // Update floating toolbar position when selection changes
    useEffect(() => {
        if (!editor) return

        const updateFloatingToolbar = () => {
            const { from, to, empty } = editor.state.selection

            if (!empty && from !== to) {
                // Text is selected, show floating toolbar
                // Get coordinates at the start of selection
                const startCoords = editor.view.coordsAtPos(from)
                // Get coordinates at the end of selection
                const endCoords = editor.view.coordsAtPos(to)
                
                if (startCoords && endCoords) {
                    // Position toolbar above the selection, centered horizontally
                    const top = Math.min(startCoords.top, endCoords.top)
                    const left = (startCoords.left + endCoords.left) / 2
                    
                    setFloatingToolbarPos({
                        top: top - 10,
                        left: left,
                    })
                    setShowFloatingToolbar(true)
                }
            } else {
                setShowFloatingToolbar(false)
                // Close color picker when selection is cleared
                setShowColorPicker(false)
                setColorPickerType(null)
            }
        }

        editor.on('selectionUpdate', updateFloatingToolbar)
        editor.on('update', updateFloatingToolbar)

        return () => {
            editor.off('selectionUpdate', updateFloatingToolbar)
            editor.off('update', updateFloatingToolbar)
        }
    }, [editor])
    

    // Calculate dropdown positions when they open
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
                <div className="w-px h-6 bg-slate-200 dark:border-slate-700 mx-1" />
                
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
                <div className="w-px h-6 bg-slate-200 dark:border-slate-700 mx-1" />
                
                {/* Text Direction */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().setTextDirection('rtl').run()}
                    className="bg-slate-100 dark:bg-slate-800"
                    title="من اليمين لليسار (RTL)"
                >
                    <AlignRight className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().setTextDirection('ltr').run()}
                    title="من اليسار لليمين (LTR)"
                >
                    <AlignLeft className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-slate-200 dark:border-slate-700 mx-1" />
                
                {/* Font Size */}
                <div className="relative">
                    <Button
                        ref={fontSizeButtonRef}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setShowFontSizeMenu(!showFontSizeMenu)
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
                <div className="w-px h-6 bg-slate-200 dark:border-slate-700 mx-1" />
                
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
                <div className="w-px h-6 bg-slate-200 dark:border-slate-700 mx-1" />
                
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
            
            {/* Floating Toolbar - appears when text is selected */}
            {showFloatingToolbar && floatingToolbarPos && isMounted && createPortal(
                <div 
                    className="fixed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-[100] p-2"
                    style={{
                        top: `${floatingToolbarPos.top}px`,
                        left: `${floatingToolbarPos.left}px`,
                        transform: 'translate(-50%, -100%)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center gap-1 flex-wrap">
                        {/* Font Size */}
                        <div className="relative">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (!editor) return
                                    const { from, to } = editor.state.selection
                                    if (from !== to) {
                                        editor.chain().focus().setTextSelection({ from, to }).setFontSize("18px").run()
                                    }
                                }}
                                title="حجم الخط"
                            >
                                <Type className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        {/* Bold */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                if (!editor) return
                                const { from, to } = editor.state.selection
                                if (from !== to) {
                                    editor.chain().focus().setTextSelection({ from, to }).toggleBold().run()
                                }
                            }}
                            className={editor.isActive("bold") ? "bg-slate-100 dark:bg-slate-800" : ""}
                            title="عريض"
                        >
                            <Bold className="h-4 w-4" />
                        </Button>
                        
                        {/* Italic */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                if (!editor) return
                                const { from, to } = editor.state.selection
                                if (from !== to) {
                                    editor.chain().focus().setTextSelection({ from, to }).toggleItalic().run()
                                }
                            }}
                            className={editor.isActive("italic") ? "bg-slate-100 dark:bg-slate-800" : ""}
                            title="مائل"
                        >
                            <Italic className="h-4 w-4" />
                        </Button>
                        
                        <div className="w-px h-6 bg-slate-200 dark:border-slate-700 mx-1" />
                        
                        {/* Text Color */}
                        <div className="relative">
                            <Button
                                ref={colorButtonRef}
                                data-color-button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onMouseDown={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    if (!editor) return
                                    const { from, to } = editor.state.selection
                                    if (from !== to) {
                                        isOpeningColorPicker.current = true
                                        // Calculate position first
                                        if (colorButtonRef.current) {
                                            const rect = colorButtonRef.current.getBoundingClientRect()
                                            setColorPickerPos({
                                                top: rect.top - 10,
                                                left: rect.left,
                                            })
                                        }
                                        // Use setTimeout to ensure state updates happen after event propagation
                                        setTimeout(() => {
                                            setColorPickerType('text')
                                            setShowColorPicker(true)
                                            setTimeout(() => {
                                                isOpeningColorPicker.current = false
                                            }, 100)
                                        }, 10)
                                    }
                                }}
                                title="لون النص"
                            >
                                <Palette className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        {/* Highlight Color */}
                        <div className="relative">
                            <Button
                                ref={highlightButtonRef}
                                data-color-button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onMouseDown={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    if (!editor) return
                                    const { from, to } = editor.state.selection
                                    if (from !== to) {
                                        isOpeningColorPicker.current = true
                                        // Calculate position first
                                        if (highlightButtonRef.current) {
                                            const rect = highlightButtonRef.current.getBoundingClientRect()
                                            setColorPickerPos({
                                                top: rect.top - 10,
                                                left: rect.left,
                                            })
                                        }
                                        // Use setTimeout to ensure state updates happen after event propagation
                                        setTimeout(() => {
                                            setColorPickerType('highlight')
                                            setShowColorPicker(true)
                                            setTimeout(() => {
                                                isOpeningColorPicker.current = false
                                            }, 100)
                                        }, 10)
                                    }
                                }}
                                className={editor.isActive("highlight") ? "bg-slate-100 dark:bg-slate-800" : ""}
                                title="لون الخلفية"
                            >
                                <Highlighter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            
            {/* Color Picker */}
            {showColorPicker && colorPickerPos && colorPickerType && isMounted && createPortal(
                <div 
                    ref={colorPickerRef}
                    data-color-picker
                    className="fixed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-[101] p-3"
                    style={{
                        top: `${colorPickerPos.top}px`,
                        left: `${colorPickerPos.left}px`,
                        transform: 'translateY(-100%)',
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="mb-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {colorPickerType === 'text' ? 'لون النص' : 'لون الخلفية'}
                    </div>
                    <div className="grid grid-cols-8 gap-1.5">
                        {[
                            '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
                            '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#000080', '#008000', '#800000',
                            '#FFD700', '#4B0082', '#FF6347', '#40E0D0', '#EE82EE', '#F0E68C', '#DDA0DD', '#98FB98',
                            '#F5DEB3', '#FFE4B5', '#DEB887', '#F4A460', '#CD853F', '#D2691E', '#B8860B', '#A0522D',
                        ].map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => {
                                    if (!editor) return
                                    const { from, to } = editor.state.selection
                                    if (from !== to) {
                                        if (colorPickerType === 'text') {
                                            editor.chain().focus().setTextSelection({ from, to }).setColor(color).run()
                                        } else {
                                            editor.chain().focus().setTextSelection({ from, to }).setHighlight({ color }).run()
                                        }
                                        setShowColorPicker(false)
                                        setColorPickerType(null)
                                    }
                                }}
                                className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => {
                                if (!editor) return
                                const { from, to } = editor.state.selection
                                if (from !== to) {
                                    if (colorPickerType === 'text') {
                                        editor.chain().focus().setTextSelection({ from, to }).unsetColor().run()
                                    } else {
                                        editor.chain().focus().setTextSelection({ from, to }).unsetHighlight().run()
                                    }
                                    setShowColorPicker(false)
                                    setColorPickerType(null)
                                }
                            }}
                            className="w-full text-xs px-2 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                        >
                            إزالة اللون
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* Click outside to close menus - backdrop behind dropdowns */}
            {(showFontSizeMenu || showColorPicker) && (
                <div 
                    className="fixed inset-0 z-[100] pointer-events-auto" 
                    onMouseDown={(e) => {
                        // Don't close if we're currently opening the color picker
                        if (isOpeningColorPicker.current) {
                            return
                        }
                        // Only close if clicking on backdrop itself, not on dropdowns or buttons
                        const target = e.target as HTMLElement
                        if (target === e.currentTarget && 
                            !target.closest('[data-color-picker]') && 
                            !target.closest('[data-color-button]') &&
                            !colorPickerRef.current?.contains(target)) {
                            setShowFontSizeMenu(false)
                            setShowColorPicker(false)
                            setColorPickerType(null)
                        }
                    }}
                    style={{ backgroundColor: 'transparent' }}
                />
            )}
        </div>
    )
}
