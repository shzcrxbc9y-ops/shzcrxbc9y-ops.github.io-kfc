'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    // Проверяем, пришли ли мы после регистрации
    if (searchParams?.get('registered') === 'true') {
      setRegistered(true)
      // Убираем параметр из URL
      router.replace('/login', { scroll: false })
    }
  }, [searchParams, router])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      setEmailError('Email обязателен')
      return false
    }
    if (!emailRegex.test(email)) {
      setEmailError('Введите корректный email адрес')
      return false
    }
    setEmailError('')
    return true
  }

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Пароль обязателен')
      return false
    }
    if (password.length < 6) {
      setPasswordError('Пароль должен быть не менее 6 символов')
      return false
    }
    setPasswordError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setEmailError('')
    setPasswordError('')

    // Валидация
    const isEmailValid = validateEmail(email)
    const isPasswordValid = validatePassword(password)

    if (!isEmailValid || !isPasswordValid) {
      return
    }

    setLoading(true)

    try {
      await login(email, password)
      // Перенаправление произойдет автоматически через AuthProvider
      router.push('/dashboard')
    } catch (err: any) {
      let errorMessage = 'Ошибка входа'
      
      if (err.message) {
        errorMessage = err.message
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMessage = 'Ошибка подключения к серверу. Проверьте интернет-соединение.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 px-4 sm:px-0">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Вход в систему
            </h2>
            <p className="text-sm text-gray-600">
              Нет аккаунта?{' '}
              <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                Зарегистрируйтесь
              </Link>
            </p>
          </div>

          {registered && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Регистрация успешна! Теперь вы можете войти.</span>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email адрес
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) validateEmail(e.target.value)
                  }}
                  onBlur={() => validateEmail(email)}
                  className={`appearance-none relative block w-full px-3 py-2.5 border ${
                    emailError ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors sm:text-sm`}
                  placeholder="your.email@example.com"
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Пароль
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (passwordError) validatePassword(e.target.value)
                    }}
                    onBlur={() => validatePassword(password)}
                    className={`appearance-none relative block w-full px-3 py-2.5 pr-10 border ${
                      passwordError ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors sm:text-sm`}
                    placeholder="Введите пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !!emailError || !!passwordError}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Вход...
                  </span>
                ) : (
                  'Войти'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
