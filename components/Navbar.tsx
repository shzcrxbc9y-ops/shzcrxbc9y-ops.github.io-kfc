'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { LogOut, User, BookOpen, Award, BarChart3, Settings } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary-600">KFC</span>
            <span className="text-gray-600">Training</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <NavLink href="/learning" isActive={isActive('/learning')} icon={<BookOpen className="w-4 h-4" />}>
                  Обучение
                </NavLink>
                <NavLink href="/tests" isActive={isActive('/tests')} icon={<Award className="w-4 h-4" />}>
                  Тесты
                </NavLink>
                <NavLink href="/dashboard" isActive={isActive('/dashboard')} icon={<BarChart3 className="w-4 h-4" />}>
                  Кабинет
                </NavLink>
                {(user.role === 'ADMIN' || user.role === 'MENTOR') && (
                  <NavLink href="/admin" isActive={isActive('/admin')} icon={<Settings className="w-4 h-4" />}>
                    Админ
                  </NavLink>
                )}
                <div className="flex items-center space-x-2 pl-4 border-l">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{user.firstName} {user.lastName}</span>
                  <button
                    onClick={logout}
                    className="ml-2 p-2 text-gray-600 hover:text-gray-900"
                    title="Выйти"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Вход
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavLink({
  href,
  isActive,
  icon,
  children,
}: {
  href: string
  isActive: boolean
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary-100 text-primary-700'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}

