import { useState } from "react"
import { db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"

interface UseToggleFavoriteOptions {
    collectionName: string
    onSuccess?: () => void
    onError?: (error: Error) => void
}

export function useToggleFavorite<T extends { id: string; isFavorite?: boolean }>(
    items: T[],
    setItems: React.Dispatch<React.SetStateAction<T[]>>,
    options: UseToggleFavoriteOptions
) {
    const [toggling, setToggling] = useState<string | null>(null)

    const toggleFavorite = async (id: string) => {
        const item = items.find(i => i.id === id)
        if (!item) return

        setToggling(id)
        try {
            const newFavoriteStatus = !(item.isFavorite ?? false)
            await updateDoc(doc(db, options.collectionName, id), { isFavorite: newFavoriteStatus })
            
            // Update local state
            setItems(prevItems => {
                const updated = prevItems.map(i => 
                    i.id === id ? { ...i, isFavorite: newFavoriteStatus } : i
                )
                // Re-sort: favorites first, then by createdAt if available
                updated.sort((a, b) => {
                    const aIsFavorite = a.isFavorite ?? false
                    const bIsFavorite = b.isFavorite ?? false
                    
                    if (aIsFavorite && !bIsFavorite) return -1
                    if (!aIsFavorite && bIsFavorite) return 1
                    
                    // If both have same favorite status and have createdAt, sort by date
                    if ('createdAt' in a && 'createdAt' in b) {
                        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt as any)
                        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt as any)
                        return dateB.getTime() - dateA.getTime()
                    }
                    
                    return 0
                })
                return updated
            })

            options.onSuccess?.()
        } catch (error) {
            console.error("Error toggling favorite:", error)
            options.onError?.(error as Error)
        } finally {
            setToggling(null)
        }
    }

    return { toggleFavorite, toggling }
}

