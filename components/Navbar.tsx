'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { LogOut, User, BookOpen, Award, BarChart3, Settings, Menu, X } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-xl sm:text-2xl font-bold text-primary-600">KFC</span>
            <span className="text-gray-600 hidden sm:inline">Training</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {user ? (
              <>
                <NavLink href="/learning" isActive={isActive('/learning')} icon={<BookOpen className="w-4 h-4" />}>
                  <span className="hidden lg:inline">Обучение</span>
                  <span className="lg:hidden">Обуч.</span>
                </NavLink>
                <NavLink href="/tests" isActive={isActive('/tests')} icon={<Award className="w-4 h-4" />}>
                  Тесты
                </NavLink>
                <NavLink href="/dashboard" isActive={isActive('/dashboard')} icon={<BarChart3 className="w-4 h-4" />}>
                  <span className="hidden lg:inline">Кабинет</span>
                  <span className="lg:hidden">Каб.</span>
                </NavLink>
                {(user.role === 'ADMIN' || user.role === 'MENTOR') && (
                  <NavLink href="/admin" isActive={isActive('/admin')} icon={<Settings className="w-4 h-4" />}>
                    Админ
                  </NavLink>
                )}
                <div className="flex items-center space-x-2 pl-2 lg:pl-4 border-l">
                  <User className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700 hidden lg:inline">{user.firstName} {user.lastName}</span>
                  <span className="text-sm text-gray-700 lg:hidden">{user.firstName}</span>
                  <button
                    onClick={logout}
                    className="ml-2 p-2 text-gray-600 hover:text-gray-900 transition-colors"
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
                  className="px-3 lg:px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors text-sm lg:text-base"
                >
                  Вход
                </Link>
                <Link
                  href="/register"
                  className="px-3 lg:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm lg:text-base"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Меню"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {user ? (
              <div className="space-y-2">
                <MobileNavLink 
                  href="/learning" 
                  isActive={isActive('/learning')} 
                  icon={<BookOpen className="w-5 h-5" />}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Обучение
                </MobileNavLink>
                <MobileNavLink 
                  href="/tests" 
                  isActive={isActive('/tests')} 
                  icon={<Award className="w-5 h-5" />}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Тесты
                </MobileNavLink>
                <MobileNavLink 
                  href="/dashboard" 
                  isActive={isActive('/dashboard')} 
                  icon={<BarChart3 className="w-5 h-5" />}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Кабинет
                </MobileNavLink>
                {(user.role === 'ADMIN' || user.role === 'MENTOR') && (
                  <MobileNavLink 
                    href="/admin" 
                    isActive={isActive('/admin')} 
                    icon={<Settings className="w-5 h-5" />}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Админ
                  </MobileNavLink>
                )}
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <div className="flex items-center space-x-3 px-4 py-2">
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{user.firstName} {user.lastName}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Выйти</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Вход
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        )}
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
      className={`flex items-center space-x-1 px-2 lg:px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary-100 text-primary-700'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="text-sm lg:text-base">{children}</span>
    </Link>
  )
}

function MobileNavLink({
  href,
  isActive,
  icon,
  children,
  onClick,
}: {
  href: string
  isActive: boolean
  icon: React.ReactNode
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
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

