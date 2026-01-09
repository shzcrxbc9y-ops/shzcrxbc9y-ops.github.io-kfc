import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'KFC Training Platform',
  description: 'Платформа обучения сотрудников KFC',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
  themeColor: '#2563eb',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KFC Training',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}

