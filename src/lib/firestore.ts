import { adminDb } from "./firebase-admin"
import { Timestamp, FieldValue } from "firebase-admin/firestore"

// Collection names
export const COLLECTIONS = {
    USERS: "users",
    WORKSPACES: "workspaces",
    WORKSPACE_MEMBERS: "workspaceMembers",
    CATEGORIES: "categories",
    PROMPTS: "prompts",
    PROMPT_VERSIONS: "promptVersions",
    PROMPT_TESTS: "promptTests",
    TWEETS: "tweets",
    TOOLS: "tools",
    PLAYBOOKS: "playbooks",
    PLAYBOOK_STEPS: "playbookSteps",
    ATTACHMENTS: "attachments",
    ACTIVITY_LOGS: "activityLogs",
    TAGS: "tags",
}

// Helper to generate IDs
export function generateId(): string {
    return adminDb.collection("_").doc().id
}

// Helper to convert Firestore timestamp to Date
export function toDate(timestamp: Timestamp | Date | undefined): Date | null {
    if (!timestamp) return null
    if (timestamp instanceof Date) return timestamp
    return timestamp.toDate()
}

// Helper to add timestamps
export function withTimestamps(data: Record<string, unknown>, isNew = true) {
    const now = Timestamp.now()
    return {
        ...data,
        updatedAt: now,
        ...(isNew ? { createdAt: now } : {}),
    }
}

// Generic CRUD operations using firebase-admin
export async function createDocument(
    collectionName: string,
    data: Record<string, unknown>,
    customId?: string
): Promise<string> {
    const id = customId || generateId()
    const docRef = adminDb.collection(collectionName).doc(id)
    await docRef.set(withTimestamps({ ...data, id }))
    return id
}

export async function getDocument<T>(
    collectionName: string,
    id: string
): Promise<T | null> {
    const docRef = adminDb.collection(collectionName).doc(id)
    const docSnap = await docRef.get()
    if (!docSnap.exists) return null
    return docSnap.data() as T
}

export async function updateDocument(
    collectionName: string,
    id: string,
    data: Partial<Record<string, unknown>>
): Promise<void> {
    const docRef = adminDb.collection(collectionName).doc(id)
    await docRef.update(withTimestamps(data, false))
}

export async function deleteDocument(
    collectionName: string,
    id: string
): Promise<void> {
    const docRef = adminDb.collection(collectionName).doc(id)
    await docRef.delete()
}

// Query documents with filters
export async function queryDocuments<T>(
    collectionName: string,
    filters: Array<{ field: string; op: FirebaseFirestore.WhereFilterOp; value: unknown }>
): Promise<T[]> {
    let query: FirebaseFirestore.Query = adminDb.collection(collectionName)

    for (const filter of filters) {
        query = query.where(filter.field, filter.op, filter.value)
    }

    const snapshot = await query.get()
    return snapshot.docs.map(doc => doc.data() as T)
}

// Workspace-scoped queries
export async function getWorkspaceDocuments<T>(
    collectionName: string,
    workspaceId: string,
    includeArchived = false
): Promise<T[]> {
    const filters: Array<{ field: string; op: FirebaseFirestore.WhereFilterOp; value: unknown }> = [
        { field: "workspaceId", op: "==", value: workspaceId },
    ]

    if (!includeArchived) {
        filters.push({ field: "isArchived", op: "==", value: false })
    }

    return queryDocuments<T>(collectionName, filters)
}
