"use client"

import { useState, useMemo } from "react"
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react"

interface CollapsibleNoteContentProps {
    content: string
    className?: string
}

interface Section {
    id: string
    title: string
    level: number
    content: string
}

export function CollapsibleNoteContent({ content, className }: CollapsibleNoteContentProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
    const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null)

    const sections = useMemo(() => {
        if (!content) return []

        const parser = new DOMParser()
        const doc = parser.parseFromString(content, "text/html")
        const body = doc.body

        const sectionsList: Section[] = []
        const headings = Array.from(body.querySelectorAll("h1, h2, h3"))

        if (headings.length === 0) return []

        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1))
            const title = heading.textContent || ""
            const id = `section-${index}`

            // Get content between this heading and next heading
            const contentParts: string[] = []
            let currentNode = heading.nextSibling
            const nextHeading = headings[index + 1]

            while (currentNode) {
                if (nextHeading && currentNode === nextHeading) break

                if (currentNode.nodeType === Node.ELEMENT_NODE) {
                    const element = currentNode as HTMLElement
                    // Skip if it's another heading
                    if (element.tagName && ["H1", "H2", "H3"].includes(element.tagName)) {
                        currentNode = currentNode.nextSibling
                        continue
                    }
                    contentParts.push(element.outerHTML)
                } else if (currentNode.nodeType === Node.TEXT_NODE) {
                    const text = currentNode.textContent || ""
                    if (text.trim()) {
                        contentParts.push(`<p>${text.trim()}</p>`)
                    }
                }

                currentNode = currentNode.nextSibling
            }

            sectionsList.push({
                id,
                title,
                level,
                content: contentParts.join(""),
            })
        })

        return sectionsList
    }, [content])

    const toggleSection = (sectionId: string) => {
        setExpandedSections((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId)
            } else {
                newSet.add(sectionId)
            }
            return newSet
        })
    }

    const copySectionContent = async (section: Section, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent toggling the section when clicking copy
        
        try {
            // Extract text content as fallback
            const parser = new DOMParser()
            const doc = parser.parseFromString(section.content, "text/html")
            const textContent = doc.body.textContent || ""
            
            // Prepare HTML content with proper formatting
            const htmlContent = section.content || ""
            
            // Use Clipboard API with both HTML and plain text formats
            const clipboardItem = new ClipboardItem({
                'text/html': new Blob([htmlContent], { type: 'text/html' }),
                'text/plain': new Blob([textContent], { type: 'text/plain' })
            })
            
            await navigator.clipboard.write([clipboardItem])
            setCopiedSectionId(section.id)
            setTimeout(() => {
                setCopiedSectionId(null)
            }, 2000)
        } catch (err) {
            // Fallback to plain text if ClipboardItem is not supported
            try {
                const parser = new DOMParser()
                const doc = parser.parseFromString(section.content, "text/html")
                const textContent = doc.body.textContent || ""
                await navigator.clipboard.writeText(textContent)
                setCopiedSectionId(section.id)
                setTimeout(() => {
                    setCopiedSectionId(null)
                }, 2000)
            } catch (fallbackErr) {
                console.error("Failed to copy:", fallbackErr)
            }
        }
    }

    // If no sections found, display content normally
    if (sections.length === 0) {
        return (
            <div
                className={`prose prose-sm sm:prose-base lg:prose-lg max-w-none dark:prose-invert ${className || ""}`}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        )
    }

    // Render with collapsible sections
    return (
        <div className={`space-y-2 ${className || ""}`}>
            {sections.map((section) => {
                const isExpanded = expandedSections.has(section.id)
                const headingSize = section.level === 1 ? "text-xl" : section.level === 2 ? "text-lg" : "text-base"
                const paddingRight = section.level === 1 ? "pr-0" : section.level === 2 ? "pr-4" : "pr-8"

                return (
                    <div key={section.id} className={`mb-3 ${paddingRight}`}>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => toggleSection(section.id)}
                                className={`flex-1 flex items-center gap-2 text-right ${headingSize} font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800`}
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-5 w-5 flex-shrink-0" />
                                ) : (
                                    <ChevronRight className="h-5 w-5 flex-shrink-0" />
                                )}
                                <span className="flex-1">{section.title}</span>
                            </button>
                            <button
                                onClick={(e) => copySectionContent(section, e)}
                                className="flex-shrink-0 p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="نسخ المحتوى"
                            >
                                {copiedSectionId === section.id ? (
                                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {isExpanded && section.content && (
                            <div className="mt-2 pr-8">
                                <div
                                    className="prose prose-sm sm:prose-base max-w-none dark:prose-invert"
                                    dangerouslySetInnerHTML={{ __html: section.content }}
                                />
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

