// Force dynamic rendering to avoid static generation without Firebase credentials
export const dynamic = 'force-dynamic'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
