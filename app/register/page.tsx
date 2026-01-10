'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    position: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'firstName':
        if (!value.trim()) return 'Имя обязательно'
        if (value.trim().length < 2) return 'Имя должно быть не менее 2 символов'
        return ''
      case 'lastName':
        if (!value.trim()) return 'Фамилия обязательна'
        if (value.trim().length < 2) return 'Фамилия должна быть не менее 2 символов'
        return ''
      case 'email':
        if (!value.trim()) return 'Email обязателен'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return 'Введите корректный email адрес'
        return ''
      case 'password':
        if (!value) return 'Пароль обязателен'
        if (value.length < 6) return 'Пароль должен быть не менее 6 символов'
        return ''
      case 'confirmPassword':
        if (!value) return 'Подтвердите пароль'
        if (value !== formData.password) return 'Пароли не совпадают'
        return ''
      default:
        return ''
    }
  }

  const handleBlur = (name: string) => {
    setTouched({ ...touched, [name]: true })
    const value = formData[name as keyof typeof formData]
    const error = validateField(name, value)
    setErrors({ ...errors, [name]: error })
  }

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
    
    // Валидация в реальном времени для уже тронутых полей
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors({ ...errors, [name]: error })
    }

    // Специальная обработка для подтверждения пароля
    if (name === 'password' && touched.confirmPassword) {
      const confirmError = validateField('confirmPassword', formData.confirmPassword)
      setErrors({ ...errors, confirmPassword: confirmError })
    }
  }

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' }
    
    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/(?=.*[a-z])/.test(password) && /(?=.*[A-Z])/.test(password)) strength++
    if (/(?=.*\d)/.test(password)) strength++

    if (strength <= 1) return { strength: 1, label: 'Слабый', color: 'bg-red-500' }
    if (strength <= 3) return { strength: 3, label: 'Средний', color: 'bg-yellow-500' }
    return { strength: 5, label: 'Сильный', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Помечаем все поля как тронутые
    const allTouched = {
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
    }
    setTouched(allTouched)

    // Валидация всех полей
    const newErrors: FormErrors = {}
    Object.keys(formData).forEach((key) => {
      if (key !== 'position') {
        const error = validateField(key, formData[key as keyof typeof formData])
        if (error) newErrors[key as keyof FormErrors] = error
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          position: formData.position.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка регистрации')
      }

      // Успешная регистрация
      router.push('/login?registered=true')
    } catch (err: any) {
      let errorMessage = 'Ошибка регистрации'
      
      if (err.message) {
        errorMessage = err.message
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMessage = 'Ошибка подключения к серверу. Проверьте интернет-соединение.'
      }
      
      setErrors({ general: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const hasError = (field: string) => touched[field] && errors[field as keyof FormErrors]
  const isValid = (field: string) => touched[field] && !errors[field as keyof FormErrors] && formData[field as keyof typeof formData]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Регистрация
            </h2>
            <p className="text-sm text-gray-600">
              Уже есть аккаунт?{' '}
              <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                Войдите в систему
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{errors.general}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Имя *
                </label>
                <div className="relative">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    onBlur={() => handleBlur('firstName')}
                    className={`appearance-none relative block w-full px-3 py-2.5 border ${
                      hasError('firstName') ? 'border-red-300' : isValid('firstName') ? 'border-green-300' : 'border-gray-300'
                    } placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors sm:text-sm`}
                    placeholder="Иван"
                  />
                  {isValid('firstName') && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
                {hasError('firstName') && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Фамилия *
                </label>
                <div className="relative">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    onBlur={() => handleBlur('lastName')}
                    className={`appearance-none relative block w-full px-3 py-2.5 border ${
                      hasError('lastName') ? 'border-red-300' : isValid('lastName') ? 'border-green-300' : 'border-gray-300'
                    } placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors sm:text-sm`}
                    placeholder="Иванов"
                  />
                  {isValid('lastName') && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
                {hasError('lastName') && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email адрес *
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`appearance-none relative block w-full px-3 py-2.5 border ${
                    hasError('email') ? 'border-red-300' : isValid('email') ? 'border-green-300' : 'border-gray-300'
                  } placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors sm:text-sm`}
                  placeholder="your.email@example.com"
                />
                {isValid('email') && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
              {hasError('email') && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Пароль *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`appearance-none relative block w-full px-3 py-2.5 pr-10 border ${
                    hasError('password') ? 'border-red-300' : isValid('password') ? 'border-green-300' : 'border-gray-300'
                  } placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors sm:text-sm`}
                  placeholder="Минимум 6 символов"
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
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Надежность пароля:</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength.label === 'Слабый' ? 'text-red-600' :
                      passwordStrength.label === 'Средний' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                      style={{ width: `${Math.min((passwordStrength.strength / 5) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
              {hasError('password') && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              {!hasError('password') && formData.password && (
                <div className="mt-2 text-xs text-gray-500">
                  <p>Минимум 6 символов</p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Подтвердите пароль *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  className={`appearance-none relative block w-full px-3 py-2.5 pr-10 border ${
                    hasError('confirmPassword') ? 'border-red-300' : isValid('confirmPassword') ? 'border-green-300' : 'border-gray-300'
                  } placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors sm:text-sm`}
                  placeholder="Повторите пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
                {isValid('confirmPassword') && (
                  <CheckCircle className="absolute right-10 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
              {hasError('confirmPassword') && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                Должность
              </label>
              <input
                id="position"
                name="position"
                type="text"
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
                className="appearance-none relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors sm:text-sm"
                placeholder="Необязательно"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || Object.keys(errors).some(key => key !== 'general' && errors[key as keyof FormErrors])}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Регистрация...
                  </span>
                ) : (
                  'Зарегистрироваться'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
