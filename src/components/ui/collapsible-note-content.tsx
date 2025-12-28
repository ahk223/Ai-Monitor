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

/**
 * CRITICAL: Process HTML before rendering to transfer span colors to headings
 * This happens BEFORE render, not after, so no timeouts or DOM manipulation needed
 * TipTap Color extension saves colors in spans inside headings, not on headings directly
 * Solution: Transfer the color from span to heading during HTML processing
 */
function processHTMLForView(html: string): string {
    if (!html || html.trim() === '') return html
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    const body = doc.body
    
    // Find all headings (h1-h6)
    const headings = body.querySelectorAll('h1, h2, h3, h4, h5, h6')
    
    headings.forEach((heading) => {
        const htmlHeading = heading as HTMLElement
        
        // Check if heading already has a color style
        const headingStyle = htmlHeading.getAttribute('style') || ''
        const hasHeadingColor = headingStyle.includes('color:')
        
        // If heading doesn't have color, check for colored spans inside
        if (!hasHeadingColor) {
            const coloredSpans = htmlHeading.querySelectorAll('span[style*="color"]')
            
            if (coloredSpans.length > 0) {
                // Get the first span's color
                const firstSpan = coloredSpans[0] as HTMLElement
                const spanStyle = firstSpan.getAttribute('style') || ''
                const colorMatch = spanStyle.match(/color:\s*([^;]+)/)
                
                if (colorMatch) {
                    const colorValue = colorMatch[1].trim()
                    // Apply the span color to the heading itself
                    const currentStyle = htmlHeading.getAttribute('style') || ''
                    const newStyle = currentStyle 
                        ? `${currentStyle}; color: ${colorValue}`
                        : `color: ${colorValue}`
                    htmlHeading.setAttribute('style', newStyle)
                }
            }
        }
        
        // Also ensure all colored spans keep their colors
        const allSpans = htmlHeading.querySelectorAll('span[style*="color"]')
        allSpans.forEach((span) => {
            const htmlSpan = span as HTMLElement
            const spanStyle = htmlSpan.getAttribute('style') || ''
            if (spanStyle.includes('color:')) {
                const colorMatch = spanStyle.match(/color:\s*([^;]+)/)
                if (colorMatch) {
                    const colorValue = colorMatch[1].trim()
                    // Ensure color is preserved
                    htmlSpan.setAttribute('style', `color: ${colorValue}`)
                }
            }
        })
    })
    
    // Also process all other elements with colors to ensure they're preserved
    const allColoredElements = body.querySelectorAll('[style*="color"]')
    allColoredElements.forEach((el) => {
        const htmlEl = el as HTMLElement
        const style = htmlEl.getAttribute('style') || ''
        if (style.includes('color:')) {
            const colorMatch = style.match(/color:\s*([^;]+)/)
            if (colorMatch) {
                const colorValue = colorMatch[1].trim()
                // Preserve the color
                htmlEl.setAttribute('style', `color: ${colorValue}`)
            }
        }
    })
    
    // Process background colors
    const allBgColoredElements = body.querySelectorAll('[style*="background-color"]')
    allBgColoredElements.forEach((el) => {
        const htmlEl = el as HTMLElement
        const style = htmlEl.getAttribute('style') || ''
        if (style.includes('background-color:')) {
            const bgColorMatch = style.match(/background-color:\s*([^;]+)/)
            if (bgColorMatch) {
                const bgColorValue = bgColorMatch[1].trim()
                // Preserve background color
                const currentStyle = htmlEl.getAttribute('style') || ''
                const colorMatch = currentStyle.match(/color:\s*([^;]+)/)
                const colorPart = colorMatch ? `color: ${colorMatch[1].trim()}; ` : ''
                htmlEl.setAttribute('style', `${colorPart}background-color: ${bgColorValue}`)
            }
        }
    })
    
    return body.innerHTML
}

export function CollapsibleNoteContent({ content, className }: CollapsibleNoteContentProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
    const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null)
    
    // Process content HTML before rendering to transfer span colors to headings
    const processedContent = useMemo(() => {
        if (!content) return ''
        return processHTMLForView(content)
    }, [content])

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

            // Process section content HTML to transfer span colors to headings
            const sectionContentHTML = contentParts.join("")
            const processedSectionContent = processHTMLForView(sectionContentHTML)

            sectionsList.push({
                id,
                title,
                level,
                content: processedSectionContent,
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
                dangerouslySetInnerHTML={{ __html: processedContent }}
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
                
                // Check if section has content (not empty or just whitespace)
                const hasContent = section.content.trim().length > 0

                return (
                    <div key={section.id} className={`mb-3 ${paddingRight}`}>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => hasContent && toggleSection(section.id)}
                                className={`flex-1 flex items-center gap-2 text-right ${headingSize} font-semibold text-slate-900 dark:text-white p-2 rounded-lg ${hasContent ? 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer' : 'cursor-default'}`}
                            >
                                {hasContent && (
                                    isExpanded ? (
                                        <ChevronDown className="h-5 w-5 flex-shrink-0" />
                                    ) : (
                                        <ChevronRight className="h-5 w-5 flex-shrink-0" />
                                    )
                                )}
                                <span className="flex-1">{section.title}</span>
                            </button>
                            {hasContent && (
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
                            )}
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
