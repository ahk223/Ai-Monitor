"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, updateDoc, getDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Modal } from "@/components/ui"
import {
    Settings,
    Plus,
    Trash2,
    Loader2,
    Palette,
    Edit2,
    Share2,
    Copy,
    Check,
    Building2,
} from "lucide-react"

interface Category {
    id: string
    name: string
    color: string
}

const colorOptions = [
    "#6366f1", // indigo
    "#22c55e", // green
    "#3b82f6", // blue
    "#f59e0b", // amber
    "#ec4899", // pink
    "#ef4444", // red
    "#8b5cf6", // purple
    "#14b8a6", // teal
]

export default function SettingsPage() {
    const { userData, signOut } = useAuth()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [newCategoryColor, setNewCategoryColor] = useState(colorOptions[0])
    const [adding, setAdding] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const [saving, setSaving] = useState(false)

    // Workspace state
    const [showEditWorkspaceModal, setShowEditWorkspaceModal] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false)
    const [workspaceName, setWorkspaceName] = useState("")
    const [newWorkspaceName, setNewWorkspaceName] = useState("")
    const [inviteCode, setInviteCode] = useState("")
    const [copied, setCopied] = useState(false)
    const [savingWorkspace, setSavingWorkspace] = useState(false)

    // Profile state
    const [showEditProfileModal, setShowEditProfileModal] = useState(false)
    const [profileName, setProfileName] = useState("")
    const [savingProfile, setSavingProfile] = useState(false)
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [changingPassword, setChangingPassword] = useState(false)
    const [passwordError, setPasswordError] = useState("")

    useEffect(() => {
        if (userData?.workspaceId) {
            fetchCategories()
            setWorkspaceName(userData.workspaceName || "")
            setProfileName(userData.name || "")
            // Generate invite code from workspace ID
            setInviteCode(userData.workspaceId)
        }
    }, [userData?.workspaceId, userData?.workspaceName, userData?.name])

    const fetchCategories = async () => {
        if (!userData?.workspaceId) return

        try {
            const categoriesQuery = query(
                collection(db, "categories"),
                where("workspaceId", "==", userData.workspaceId)
            )
            const snap = await getDocs(categoriesQuery)
            const cats = snap.docs.map(doc => doc.data() as Category)
            setCategories(cats)
        } catch (error) {
            console.error("Error fetching categories:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddCategory = async () => {
        if (!userData?.workspaceId || !newCategoryName.trim()) return

        setAdding(true)
        try {
            const categoryId = doc(collection(db, "categories")).id
            const newCategory: Category = {
                id: categoryId,
                name: newCategoryName,
                color: newCategoryColor,
            }

            await setDoc(doc(db, "categories", categoryId), {
                ...newCategory,
                workspaceId: userData.workspaceId,
                createdAt: new Date(),
            })

            setCategories([...categories, newCategory])
            setNewCategoryName("")
            setNewCategoryColor(colorOptions[0])
        } catch (error) {
            console.error("Error adding category:", error)
        } finally {
            setAdding(false)
        }
    }

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا التصنيف؟")) return

        try {
            await deleteDoc(doc(db, "categories", id))
            setCategories(categories.filter(c => c.id !== id))
        } catch (error) {
            console.error("Error deleting category:", error)
        }
    }

    const handleEditCategory = (category: Category) => {
        setEditingCategory({ ...category })
        setShowEditModal(true)
    }

    const handleSaveEdit = async () => {
        if (!editingCategory || !editingCategory.name.trim()) return

        setSaving(true)
        try {
            await updateDoc(doc(db, "categories", editingCategory.id), {
                name: editingCategory.name,
                color: editingCategory.color,
                updatedAt: new Date(),
            })
            setCategories(categories.map(c =>
                c.id === editingCategory.id ? editingCategory : c
            ))
            setShowEditModal(false)
            setEditingCategory(null)
        } catch (error) {
            console.error("Error updating category:", error)
        } finally {
            setSaving(false)
        }
    }

    // Profile handlers
    const handleSaveProfile = async () => {
        if (!profileName.trim() || !userData?.id) return

        setSavingProfile(true)
        try {
            await updateDoc(doc(db, "users", userData.id), {
                name: profileName,
                updatedAt: new Date(),
            })
            setShowEditProfileModal(false)
            // Refresh page to update context
            window.location.reload()
        } catch (error) {
            console.error("Error updating profile:", error)
        } finally {
            setSavingProfile(false)
        }
    }

    const handleChangePassword = async () => {
        setPasswordError("")
        if (!newPassword || !confirmPassword) {
            setPasswordError("يرجى ملء جميع الحقول")
            return
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("كلمة المرور الجديدة غير متطابقة")
            return
        }
        if (newPassword.length < 6) {
            setPasswordError("كلمة المرور يجب أن تكون 6 أحرف على الأقل")
            return
        }

        setChangingPassword(true)
        try {
            // Firebase password update requires re-authentication
            // For now, show a message to reset via email
            alert("لتغيير كلمة المرور، يرجى استخدام خيار 'نسيت كلمة المرور' في صفحة تسجيل الدخول")
            setShowChangePasswordModal(false)
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
        } catch (error) {
            console.error("Error changing password:", error)
            setPasswordError("حدث خطأ أثناء تغيير كلمة المرور")
        } finally {
            setChangingPassword(false)
        }
    }

    // Workspace handlers
    const handleSaveWorkspace = async () => {
        if (!workspaceName.trim() || !userData?.workspaceId) return

        setSavingWorkspace(true)
        try {
            await updateDoc(doc(db, "workspaces", userData.workspaceId), {
                name: workspaceName,
                updatedAt: new Date(),
            })
            // Also update user's workspaceName
            await updateDoc(doc(db, "users", userData.id), {
                workspaceName: workspaceName,
            })
            setShowEditWorkspaceModal(false)
            window.location.reload()
        } catch (error) {
            console.error("Error updating workspace:", error)
        } finally {
            setSavingWorkspace(false)
        }
    }

    const handleCopyInviteCode = () => {
        navigator.clipboard.writeText(inviteCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleCreateWorkspace = async () => {
        if (!newWorkspaceName.trim() || !userData?.id) {
            alert("يرجى إدخال اسم مساحة العمل")
            return
        }

        setSavingWorkspace(true)
        try {
            const workspaceId = doc(collection(db, "workspaces")).id
            await setDoc(doc(db, "workspaces", workspaceId), {
                id: workspaceId,
                name: newWorkspaceName,
                ownerId: userData.id,
                createdAt: new Date(),
            })
            // Update user to new workspace
            await updateDoc(doc(db, "users", userData.id), {
                workspaceId: workspaceId,
                workspaceName: newWorkspaceName,
                role: "OWNER",
            })
            alert("تم إنشاء مساحة العمل بنجاح!")
            setShowCreateWorkspaceModal(false)
            setNewWorkspaceName("")
            window.location.reload()
        } catch (error: any) {
            console.error("Error creating workspace:", error)
            alert("حدث خطأ أثناء إنشاء مساحة العمل: " + (error?.message || "خطأ غير معروف"))
        } finally {
            setSavingWorkspace(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    الإعدادات
                </h1>
                <p className="text-slate-500">إدارة حسابك ومساحة العمل</p>
            </div>

            {/* Account Info */}
            <Card>
                <CardHeader>
                    <CardTitle>معلومات الحساب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                                {userData?.name}
                            </p>
                            <p className="text-sm text-slate-500">{userData?.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => {
                                setProfileName(userData?.name || "")
                                setShowEditProfileModal(true)
                            }}>
                                <Edit2 className="h-4 w-4 ml-1" />
                                تعديل
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowChangePasswordModal(true)}>
                                تغيير كلمة المرور
                            </Button>
                        </div>
                    </div>
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                        <Button variant="outline" onClick={signOut} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                            تسجيل الخروج
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Workspace Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        مساحة العمل
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                                {userData?.workspaceName}
                            </p>
                            <p className="text-sm text-slate-500">
                                الدور: {userData?.role === "OWNER" ? "مالك" : "عضو"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {userData?.role === "OWNER" && (
                                <Button variant="outline" size="sm" onClick={() => {
                                    setWorkspaceName(userData?.workspaceName || "")
                                    setShowEditWorkspaceModal(true)
                                }}>
                                    <Edit2 className="h-4 w-4 ml-1" />
                                    تعديل
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => setShowShareModal(true)}>
                                <Share2 className="h-4 w-4 ml-1" />
                                مشاركة
                            </Button>
                        </div>
                    </div>
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                        <Button variant="outline" onClick={() => setShowCreateWorkspaceModal(true)}>
                            <Plus className="h-4 w-4 ml-1" />
                            إنشاء مساحة عمل جديدة
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Categories */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        التصنيفات
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Existing Categories */}
                    <div className="space-y-2">
                        {categories.map(category => (
                            <div
                                key={category.id}
                                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="h-4 w-4 rounded-full"
                                        style={{ backgroundColor: category.color }}
                                    />
                                    <span className="font-medium">{category.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEditCategory(category)}
                                        className="text-slate-400 hover:text-indigo-600"
                                        title="تعديل"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(category.id)}
                                        className="text-slate-400 hover:text-red-600"
                                        title="حذف"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add New Category */}
                    <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            إضافة تصنيف جديد
                        </p>
                        <div className="flex gap-3">
                            <Input
                                placeholder="اسم التصنيف"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="flex-1"
                            />
                            <div className="flex gap-1">
                                {colorOptions.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setNewCategoryColor(color)}
                                        className={`h-8 w-8 rounded-lg transition-all ${newCategoryColor === color
                                            ? "ring-2 ring-indigo-500 ring-offset-2"
                                            : ""
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                        <Button
                            onClick={handleAddCategory}
                            disabled={!newCategoryName.trim() || adding}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4" />
                            إضافة تصنيف
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Category Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false)
                    setEditingCategory(null)
                }}
                title="تعديل التصنيف"
            >
                {editingCategory && (
                    <div className="space-y-4">
                        <Input
                            label="اسم التصنيف"
                            placeholder="اسم التصنيف"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        />
                        <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">اللون</p>
                            <div className="flex gap-2">
                                {colorOptions.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setEditingCategory({ ...editingCategory, color })}
                                        className={`h-8 w-8 rounded-lg transition-all ${editingCategory.color === color
                                            ? "ring-2 ring-indigo-500 ring-offset-2"
                                            : ""
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={() => {
                                setShowEditModal(false)
                                setEditingCategory(null)
                            }}>
                                إلغاء
                            </Button>
                            <Button onClick={handleSaveEdit} isLoading={saving}>
                                حفظ التعديلات
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Profile Modal */}
            <Modal
                isOpen={showEditProfileModal}
                onClose={() => setShowEditProfileModal(false)}
                title="تعديل الملف الشخصي"
            >
                <div className="space-y-4">
                    <Input
                        label="الاسم"
                        placeholder="اسمك"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setShowEditProfileModal(false)}>
                            إلغاء
                        </Button>
                        <Button onClick={handleSaveProfile} isLoading={savingProfile}>
                            حفظ
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                isOpen={showChangePasswordModal}
                onClose={() => {
                    setShowChangePasswordModal(false)
                    setPasswordError("")
                    setCurrentPassword("")
                    setNewPassword("")
                    setConfirmPassword("")
                }}
                title="تغيير كلمة المرور"
            >
                <div className="space-y-4">
                    <Input
                        label="كلمة المرور الجديدة"
                        type="password"
                        placeholder="كلمة المرور الجديدة"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Input
                        label="تأكيد كلمة المرور"
                        type="password"
                        placeholder="أعد كتابة كلمة المرور"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {passwordError && (
                        <p className="text-sm text-red-600">{passwordError}</p>
                    )}
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setShowChangePasswordModal(false)}>
                            إلغاء
                        </Button>
                        <Button onClick={handleChangePassword} isLoading={changingPassword}>
                            تغيير
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Workspace Modal */}
            <Modal
                isOpen={showEditWorkspaceModal}
                onClose={() => setShowEditWorkspaceModal(false)}
                title="تعديل مساحة العمل"
            >
                <div className="space-y-4">
                    <Input
                        label="اسم مساحة العمل"
                        placeholder="اسم مساحة العمل"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setShowEditWorkspaceModal(false)}>
                            إلغاء
                        </Button>
                        <Button onClick={handleSaveWorkspace} isLoading={savingWorkspace}>
                            حفظ
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Share Workspace Modal */}
            <Modal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                title="مشاركة مساحة العمل"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        شارك هذا الكود مع الأشخاص الذين تريد دعوتهم للانضمام لمساحة العمل
                    </p>
                    <div className="flex items-center gap-2">
                        <Input
                            value={inviteCode}
                            readOnly
                            dir="ltr"
                            className="font-mono text-sm"
                        />
                        <Button onClick={handleCopyInviteCode} variant="outline">
                            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                    {copied && (
                        <p className="text-sm text-green-600">تم نسخ الكود!</p>
                    )}
                </div>
            </Modal>

            {/* Create Workspace Modal */}
            <Modal
                isOpen={showCreateWorkspaceModal}
                onClose={() => {
                    setShowCreateWorkspaceModal(false)
                    setNewWorkspaceName("")
                }}
                title="إنشاء مساحة عمل جديدة"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        سيتم نقلك لمساحة العمل الجديدة وستفقد الوصول لمساحة العمل الحالية
                    </p>
                    <Input
                        label="اسم مساحة العمل الجديدة"
                        placeholder="مثال: مشروعي الجديد"
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setShowCreateWorkspaceModal(false)}>
                            إلغاء
                        </Button>
                        <Button onClick={handleCreateWorkspace} isLoading={savingWorkspace}>
                            إنشاء
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
