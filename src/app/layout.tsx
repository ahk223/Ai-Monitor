import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "AI Knowledge Hub | إدارة المعرفة التشغيلية",
  description: "نظام SaaS لإدارة البروبمتات والأدوات والمعرفة التشغيلية في التعامل مع الذكاء الاصطناعي",
  keywords: ["AI", "prompts", "knowledge management", "SaaS", "productivity"],
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" className={inter.variable}>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  )
}
