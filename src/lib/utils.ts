import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        
        // Validate date
        if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
            return 'تاريخ غير صالح'
        }
        
        return dateObj.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    } catch (error) {
        console.error('Error formatting date:', error)
        return 'تاريخ غير صالح'
    }
}

export function formatDateEnglish(date: Date | string): string {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        
        // Validate date
        if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
            return 'Invalid date'
        }
        
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(dateObj)
    } catch (error) {
        console.error('Error formatting date:', error)
        return 'Invalid date'
    }
}

export function formatRelativeTime(date: Date | string): string {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        
        // Validate date
        if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
            return 'تاريخ غير صالح'
        }
        
        const now = new Date()
        const target = dateObj
        const diffMs = now.getTime() - target.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffMins < 1) return 'الآن'
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`
        if (diffHours < 24) return `منذ ${diffHours} ساعة`
        if (diffDays < 7) return `منذ ${diffDays} يوم`
        return formatDate(date)
    } catch (error) {
        console.error('Error formatting relative time:', error)
        return 'تاريخ غير صالح'
    }
}

export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
}

export function extractVariables(content: string): string[] {
    const regex = /\{\{(\w+)\}\}/g
    const matches: string[] = []
    let match
    while ((match = regex.exec(content)) !== null) {
        if (!matches.includes(match[1])) {
            matches.push(match[1])
        }
    }
    return matches
}

export function replaceVariables(content: string, variables: Record<string, string>): string {
    return content.replace(/\{\{(\w+)\}\}/g, (match, name) => {
        return variables[name] ?? match
    })
}

export function truncate(text: string, length: number): string {
    if (text.length <= length) return text
    return text.slice(0, length) + '...'
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

export function ratingToStars(rating: number | null | undefined): string {
    if (!rating) return '☆☆☆☆☆'
    const fullStars = Math.floor(rating)
    const hasHalf = rating % 1 >= 0.5
    return '★'.repeat(fullStars) + (hasHalf ? '½' : '') + '☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0))
}
