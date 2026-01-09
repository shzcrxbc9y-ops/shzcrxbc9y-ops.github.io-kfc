'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  position?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Ошибка входа')
      }

      const data = await res.json()
      
      // Обновляем пользователя после успешного входа
      await refreshUser()
      
      return data
    } catch (error: any) {
      // Если это ошибка сети или подключения
      if (error.message?.includes('fetch') || error.message?.includes('network') || error.name === 'TypeError') {
        throw new Error('Ошибка подключения к серверу. Проверьте интернет-соединение.')
      }
      // Пробрасываем ошибку дальше
      throw error
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

