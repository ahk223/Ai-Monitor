"use client"

import { Star } from "lucide-react"

interface StarRatingProps {
    rating: number // 0-5
    onRatingChange?: (rating: number) => void
    readonly?: boolean
    size?: number
}

export function StarRating({ rating, onRatingChange, readonly = false, size = 16 }: StarRatingProps) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => onRatingChange?.(star)}
                    className={`transition-all hover:scale-110 ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
                >
                    <Star
                        size={size}
                        className={`${star <= rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-slate-100 text-slate-300 dark:fill-slate-800 dark:text-slate-700"
                            }`}
                    />
                </button>
            ))}
        </div>
    )
}
