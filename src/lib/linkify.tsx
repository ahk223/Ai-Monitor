"use client"

import React from "react"

// Convert URLs in text to clickable links
export function linkifyContent(text: string): React.ReactNode[] {
    if (!text) return [text]
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)

    return parts.map((part, index) => {
        if (part.match(urlRegex)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline break-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </a>
            )
        }
        return part
    })
}

