import { getCurrentUser } from '@/lib/auth'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import TestsList from '@/components/TestsList'

export default async function AdminTestsPage() {
  try {
    await requireAuth('ADMIN')
  } catch {
    redirect('/dashboard')
  }

  const tests = await prisma.test.findMany({
    include: {
      section: {
        include: {
          station: true,
        },
      },
      _count: {
        select: {
          questions: true,
          results: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Статистика - безопасный расчет
  const totalTests = tests.length || 0
  const totalQuestions = tests.reduce((sum, t) => {
    const count = t._count?.questions || 0
    return sum + (typeof count === 'number' ? count : 0)
  }, 0)
  const totalResults = tests.reduce((sum, t) => {
    const count = t._count?.results || 0
    return sum + (typeof count === 'number' ? count : 0)
  }, 0)
  const testsWithoutQuestions = tests.filter(t => {
    const count = t._count?.questions || 0
    return count === 0 || !count
  }).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Заголовок */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900 text-sm mb-2 inline-block transition-colors font-medium"
              >
                ← Назад в админ-панель
              </Link>
              <h1 className="text-2xl font-semibold text-gray-900">Управление тестами</h1>
              <p className="text-gray-600 mt-1 text-sm">Создание, редактирование и анализ тестов</p>
            </div>
            <Link
              href="/admin/tests/new"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-2 text-sm font-medium shadow-sm"
            >
              <span>+</span>
              <span>Создать тест</span>
            </Link>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Всего тестов</div>
            <div className="text-2xl font-bold text-gray-900">{totalTests}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Всего вопросов</div>
            <div className="text-2xl font-bold text-blue-600">{totalQuestions}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Прохождений</div>
            <div className="text-2xl font-bold text-green-600">{totalResults}</div>
          </div>
        </div>

        {/* Предупреждение о тестах без вопросов */}
        {testsWithoutQuestions > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  {testsWithoutQuestions} {testsWithoutQuestions === 1 ? 'тест' : 'тестов'} без вопросов. Добавьте вопросы для активации.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Список тестов */}
        <TestsList tests={tests} />
      </div>
    </div>
  )
}

