import { getCurrentUser } from '@/lib/auth'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import TestDeleteButton from '@/components/TestDeleteButton'

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
        {tests.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет тестов</h3>
            <p className="text-gray-600 mb-4">Создайте первый тест для начала работы</p>
            <Link
              href="/admin/tests/new"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Создать тест
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map((test) => (
              <div key={test.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h2 className="text-xl font-semibold text-gray-900">{test.title}</h2>
                      {test._count.questions === 0 && (
                        <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                          Нет вопросов
                        </span>
                      )}
                    </div>
                    {test.description && (
                      <p className="text-gray-600 mb-3 text-sm">{test.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {test.section.station?.name} → {test.section.title}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4 text-sm mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Проходной балл:</span>
                    <span className="font-semibold text-gray-900">{test.passingScore}%</span>
                  </div>
                  {test.timeLimit ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Лимит времени:</span>
                      <span className="font-semibold text-gray-900">{test.timeLimit} мин.</span>
                    </div>
                  ) : (
                    <div className="text-gray-500">Без лимита времени</div>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Вопросов:</span>
                    <span className={`font-semibold ${test._count.questions === 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                      {test._count.questions}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Прохождений:</span>
                    <span className="font-semibold text-gray-900">{test._count.results}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  <Link
                    href={`/admin/tests/${test.id}/questions`}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                  >
                    Вопросы ({test._count.questions})
                  </Link>
                  <Link
                    href={`/admin/tests/${test.id}/results`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                  >
                    Результаты ({test._count.results})
                  </Link>
                  <Link
                    href={`/admin/tests/${test.id}/edit`}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
                  >
                    Редактировать
                  </Link>
                  <TestDeleteButton testId={test.id} testTitle={test.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

