"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile
} from "firebase/auth"
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore"
import { useRouter } from "next/navigation"

interface UserData {
    id: string
    email: string
    name: string | null
    avatar: string | null
    workspaceId: string | null
    workspaceName: string | null
    role: string
}

interface AuthContextType {
    user: User | null
    userData: UserData | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, name: string, workspaceName: string) => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [userData, setUserData] = useState<UserData | null>(null)
    const [loading, setLoading] = useState(true)
    const [firebaseReady, setFirebaseReady] = useState(false)
    const router = useRouter()

    // Initialize Firebase only on client
    useEffect(() => {
        const init = async () => {
            // Dynamic import to ensure client-side only
            const { auth, db } = await import("@/lib/firebase")

            if (!auth || !db) {
                console.error("Firebase not initialized")
                setLoading(false)
                return
            }

            setFirebaseReady(true)

            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                setUser(firebaseUser)

                if (firebaseUser) {
                    try {
                        // Fetch user data from Firestore
                        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

                        if (userDoc.exists()) {
                            const data = userDoc.data()

                            // Get workspace membership
                            const membershipsQuery = query(
                                collection(db, "workspaceMembers"),
                                where("userId", "==", firebaseUser.uid)
                            )
                            const memberships = await getDocs(membershipsQuery)

                            let workspaceId = null
                            let workspaceName = null
                            let role = "MEMBER"

                            if (!memberships.empty) {
                                const membership = memberships.docs[0].data()
                                workspaceId = membership.workspaceId
                                role = membership.role

                                // Get workspace name
                                const workspaceDoc = await getDoc(doc(db, "workspaces", workspaceId))
                                if (workspaceDoc.exists()) {
                                    workspaceName = workspaceDoc.data().name
                                }
                            }

                            setUserData({
                                id: firebaseUser.uid,
                                email: firebaseUser.email || "",
                                name: data.name || firebaseUser.displayName,
                                avatar: data.avatar || firebaseUser.photoURL,
                                workspaceId,
                                workspaceName,
                                role,
                            })
                        } else {
                            // User exists in Auth but not in Firestore - create basic userData
                            setUserData({
                                id: firebaseUser.uid,
                                email: firebaseUser.email || "",
                                name: firebaseUser.displayName,
                                avatar: firebaseUser.photoURL,
                                workspaceId: null,
                                workspaceName: null,
                                role: "MEMBER",
                            })
                        }
                    } catch (error) {
                        console.error("Error fetching user data:", error)
                        // Set minimal user data on error
                        setUserData({
                            id: firebaseUser.uid,
                            email: firebaseUser.email || "",
                            name: firebaseUser.displayName,
                            avatar: firebaseUser.photoURL,
                            workspaceId: null,
                            workspaceName: null,
                            role: "MEMBER",
                        })
                    }
                } else {
                    setUserData(null)
                }

                setLoading(false)
            })

            return () => unsubscribe()
        }

        init()
    }, [])

    const signIn = async (email: string, password: string) => {
        const { auth } = await import("@/lib/firebase")
        if (!auth) throw new Error("Firebase not initialized")

        await signInWithEmailAndPassword(auth, email, password)
        router.push("/dashboard")
    }

    const signUp = async (email: string, password: string, name: string, workspaceName: string) => {
        const { auth, db } = await import("@/lib/firebase")
        if (!auth || !db) throw new Error("Firebase not initialized")

        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const firebaseUser = userCredential.user

        // Update display name
        await updateProfile(firebaseUser, { displayName: name })

        // Create user document
        await setDoc(doc(db, "users", firebaseUser.uid), {
            id: firebaseUser.uid,
            email,
            name,
            avatar: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        // Generate workspace ID
        const workspaceId = doc(collection(db, "workspaces")).id

        // Create workspace
        const slug = workspaceName
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-") + "-" + Date.now()

        await setDoc(doc(db, "workspaces", workspaceId), {
            id: workspaceId,
            name: workspaceName,
            slug,
            description: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        // Create membership
        const membershipId = doc(collection(db, "workspaceMembers")).id
        await setDoc(doc(db, "workspaceMembers", membershipId), {
            id: membershipId,
            userId: firebaseUser.uid,
            workspaceId,
            role: "OWNER",
            createdAt: new Date(),
        })

        // Create default categories
        const defaultCategories = [
            { name: "عام", color: "#6366f1" },
            { name: "توليد المحتوى", color: "#22c55e" },
            { name: "برمجة", color: "#3b82f6" },
            { name: "تحليل", color: "#f59e0b" },
            { name: "تسويق", color: "#ec4899" },
        ]

        for (const cat of defaultCategories) {
            const catId = doc(collection(db, "categories")).id
            await setDoc(doc(db, "categories", catId), {
                id: catId,
                workspaceId,
                ...cat,
                createdAt: new Date(),
            })
        }

        router.push("/dashboard")
    }

    const signOut = async () => {
        const { auth } = await import("@/lib/firebase")
        if (!auth) return

        await firebaseSignOut(auth)
        setUserData(null)
        router.push("/login")
    }

    return (
        <AuthContext.Provider value={{ user, userData, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
