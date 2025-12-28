"use client"

import { useState, useMemo, useEffect, useRef } from "react"
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
    const containerRef = useRef<HTMLDivElement>(null)
    
    // Ensure inline color styles are preserved after render
    useEffect(() => {
        const applyColors = () => {
            if (!containerRef.current) return
            
            // Find all elements with inline color styles and ensure they're preserved
            // This includes headings H1, H2, H3, spans, and any other elements
            const elementsWithColor = containerRef.current.querySelectorAll('[style*="color"]')
            elementsWithColor.forEach((el) => {
                const htmlEl = el as HTMLElement
                const style = htmlEl.getAttribute('style')
                if (style && style.includes('color:')) {
                    // Extract color value
                    const colorMatch = style.match(/color:\s*([^;]+)/)
                    if (colorMatch) {
                        const colorValue = colorMatch[1].trim()
                        // Force the color to be applied with !important using setProperty
                        // This works for all elements including headings H1, H2, H3
                        htmlEl.style.setProperty('color', colorValue, 'important')
                    }
                }
            })
            
            // Also check for headings that might have color in child spans
            const headings = containerRef.current.querySelectorAll('h1, h2, h3')
            headings.forEach((heading) => {
                const htmlHeading = heading as HTMLElement
                let hasColor = false
                let colorValue = ''
                
                // Check if heading itself has color
                const headingStyle = htmlHeading.getAttribute('style')
                if (headingStyle && headingStyle.includes('color:')) {
                    const colorMatch = headingStyle.match(/color:\s*([^;]+)/)
                    if (colorMatch) {
                        colorValue = colorMatch[1].trim()
                        htmlHeading.style.setProperty('color', colorValue, 'important')
                        hasColor = true
                        htmlHeading.classList.add('has-custom-color')
                    }
                }
                
                // Check for spans inside headings with colors
                const spansInHeading = htmlHeading.querySelectorAll('span[style*="color"]')
                spansInHeading.forEach((span) => {
                    const htmlSpan = span as HTMLElement
                    const spanStyle = htmlSpan.getAttribute('style')
                    if (spanStyle && spanStyle.includes('color:')) {
                        const colorMatch = spanStyle.match(/color:\s*([^;]+)/)
                        if (colorMatch) {
                            const spanColorValue = colorMatch[1].trim()
                            htmlSpan.style.setProperty('color', spanColorValue, 'important')
                            // If heading doesn't have color, apply span color to heading
                            if (!hasColor) {
                                colorValue = spanColorValue
                                htmlHeading.style.setProperty('color', colorValue, 'important')
                                hasColor = true
                            }
                            htmlHeading.classList.add('has-custom-color')
                        }
                    }
                })
                
                // Store color value for hover preservation
                if (hasColor && colorValue) {
                    (htmlHeading as any).__customColor = colorValue
                }
            })
            
            // Add event listeners to preserve colors on hover for headings
            const headingsWithColor = containerRef.current.querySelectorAll('h1.has-custom-color, h2.has-custom-color, h3.has-custom-color, h1[style*="color"], h2[style*="color"], h3[style*="color"]')
            headingsWithColor.forEach((heading) => {
                const htmlHeading = heading as HTMLElement
                let colorValue = ''
                
                // Get color from stored value or from style attribute
                if ((htmlHeading as any).__customColor) {
                    colorValue = (htmlHeading as any).__customColor
                } else {
                    const style = htmlHeading.getAttribute('style')
                    if (style && style.includes('color:')) {
                        const colorMatch = style.match(/color:\s*([^;]+)/)
                        if (colorMatch) {
                            colorValue = colorMatch[1].trim()
                        }
                    }
                }
                
                if (colorValue) {
                    // Reapply color on hover to override any hover effects
                    const preserveColor = () => {
                        // Apply multiple times to ensure it sticks
                        htmlHeading.style.setProperty('color', colorValue, 'important')
                        // Also set directly on the element
                        htmlHeading.style.color = colorValue
                        // Force a reflow to ensure the style is applied
                        void htmlHeading.offsetHeight
                        htmlHeading.style.setProperty('color', colorValue, 'important')
                    }
                    
                    // Use capture phase to ensure our handler runs first
                    const handleMouseEnter = (e: Event) => {
                        e.stopPropagation()
                        preserveColor()
                    }
                    const handleMouseLeave = (e: Event) => {
                        e.stopPropagation()
                        preserveColor()
                    }
                    const handleMouseOver = (e: Event) => {
                        e.stopPropagation()
                        preserveColor()
                    }
                    
                    // Remove existing listeners first
                    htmlHeading.removeEventListener('mouseenter', handleMouseEnter, true)
                    htmlHeading.removeEventListener('mouseleave', handleMouseLeave, true)
                    htmlHeading.removeEventListener('mouseover', handleMouseOver, true)
                    
                    // Add new listeners with capture phase
                    htmlHeading.addEventListener('mouseenter', handleMouseEnter, true)
                    htmlHeading.addEventListener('mouseleave', handleMouseLeave, true)
                    htmlHeading.addEventListener('mouseover', handleMouseOver, true)
                    
                    // Also apply immediately and repeatedly
                    preserveColor()
                    setTimeout(preserveColor, 0)
                    setTimeout(preserveColor, 10)
                    setTimeout(preserveColor, 50)
                }
            })
            
            // Find all elements with inline background-color styles
            const elementsWithBgColor = containerRef.current.querySelectorAll('[style*="background-color"]')
            elementsWithBgColor.forEach((el) => {
                const htmlEl = el as HTMLElement
                const style = htmlEl.getAttribute('style')
                if (style && style.includes('background-color:')) {
                    // Extract background-color value
                    const bgColorMatch = style.match(/background-color:\s*([^;]+)/)
                    if (bgColorMatch) {
                        const bgColorValue = bgColorMatch[1].trim()
                        // Force the background-color to be applied with !important
                        htmlEl.style.setProperty('background-color', bgColorValue, 'important')
                        // Add padding for better visibility
                        if (!htmlEl.style.padding) {
                            htmlEl.style.setProperty('padding', '0.125em 0.25em', 'important')
                        }
                        if (!htmlEl.style.borderRadius) {
                            htmlEl.style.setProperty('border-radius', '0.25em', 'important')
                        }
                    }
                }
            })
        }
        
        // Apply colors immediately
        applyColors()
        
        // Use setTimeout to ensure DOM is fully rendered
        // Apply multiple times to ensure colors stick
        const timeoutId1 = setTimeout(applyColors, 0)
        const timeoutId2 = setTimeout(applyColors, 10)
        const timeoutId3 = setTimeout(applyColors, 50)
        const timeoutId4 = setTimeout(applyColors, 100)
        const timeoutId5 = setTimeout(applyColors, 200)
        
        // Use MutationObserver to watch for DOM changes
        let observer: MutationObserver | null = null
        if (containerRef.current) {
            observer = new MutationObserver(() => {
                applyColors()
            })
            observer.observe(containerRef.current, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style']
            })
        }
        
        return () => {
            clearTimeout(timeoutId1)
            clearTimeout(timeoutId2)
            clearTimeout(timeoutId3)
            clearTimeout(timeoutId4)
            clearTimeout(timeoutId5)
            if (observer) {
                observer.disconnect()
            }
        }
    }, [content, expandedSections])

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
                ref={containerRef}
                className={`prose prose-sm sm:prose-base lg:prose-lg max-w-none dark:prose-invert ${className || ""}`}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        )
    }

    // Render with collapsible sections
    return (
        <div ref={containerRef} className={`space-y-2 ${className || ""}`}>
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

