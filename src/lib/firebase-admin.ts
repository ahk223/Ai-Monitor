import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"

// Initialize Firebase Admin (server-side)
function initAdmin() {
    if (getApps().length === 0) {
        // Use service account credentials from environment variable
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            : undefined

        if (serviceAccount) {
            initializeApp({
                credential: cert(serviceAccount),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            })
        } else {
            // Fallback for development - uses default credentials
            initializeApp({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            })
        }
    }
}

initAdmin()

export const adminAuth = getAuth()
export const adminDb = getFirestore()
export const adminStorage = getStorage()
