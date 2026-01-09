import { getCurrentUser } from '@/lib/auth'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function TestResultsPage({
  params,
}: {
  params: { id: string }
}) {
  try {
    await requireAuth('ADMIN')
  } catch {
    redirect('/dashboard')
  }

  const testId = params.id

  // Получаем тест и результаты
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      section: {
        include: {
          station: true,
        },
      },
    },
  })

  if (!test) {
    redirect('/admin/tests')
  }

  const results = await prisma.testResult.findMany({
    where: { testId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          position: true,
        },
      },
      _count: {
        select: {
          answers: true,
        },
      },
    },
    orderBy: { completedAt: 'desc' },
  })

  // Статистика - безопасный расчет с проверками
  const totalResults = results.length || 0
  const completedResults = results.filter(r => r.status && (r.status === 'PASSED' || r.status === 'FAILED' || r.status === 'COMPLETED'))
  const passedResults = results.filter(r => r.status === 'PASSED').length || 0
  const failedResults = results.filter(r => r.status === 'FAILED').length || 0
  const inProgressResults = results.filter(r => r.status === 'IN_PROGRESS').length || 0
  
  // Средний балл только для завершенных тестов с валидным score
  const validScores = completedResults.filter(r => 
    r.completedAt && 
    r.score !== null && 
    r.score !== undefined && 
    typeof r.score === 'number' && 
    !isNaN(r.score) && 
    r.score >= 0 && 
    r.score <= 100
  )
  const averageScore = validScores.length > 0
    ? Math.round(validScores.reduce((sum, r) => sum + (r.score || 0), 0) / validScores.length)
    : 0
  
  // Процент успеха
  const passRate = completedResults.length > 0
    ? Math.round((passedResults / completedResults.length) * 100)
    : 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASSED':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'IN_PROGRESS':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'Пройден'
      case 'FAILED':
        return 'Не пройден'
      case 'IN_PROGRESS':
        return 'В процессе'
      case 'COMPLETED':
        return 'Завершен'
      default:
        return 'Не начат'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/admin/tests"
                className="text-gray-600 hover:text-gray-900 text-sm mb-2 inline-block transition-colors font-medium"
              >
                ← Назад к тестам
              </Link>
              <h1 className="text-2xl font-semibold text-gray-900">Результаты теста</h1>
              <p className="text-gray-600 mt-1 text-sm">Анализ прохождений и статистика</p>
            </div>
          </div>
        </div>

        {/* Информация о тесте */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{test.title}</h2>
          {test.description && (
            <p className="text-gray-600 mb-4 text-sm">{test.description}</p>
          )}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {test.section.station?.name} → {test.section.title}
            </span>
            <span>Проходной балл: <strong>{test.passingScore}%</strong></span>
            {test.timeLimit && <span>Лимит времени: <strong>{test.timeLimit} мин.</strong></span>}
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className="text-2xl font-bold text-gray-900">{totalResults}</div>
            <div className="text-sm text-gray-600 mt-1">Всего попыток</div>
            {completedResults.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">{completedResults.length} завершено</div>
            )}
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className="text-2xl font-bold text-green-600">{passedResults}</div>
            <div className="text-sm text-gray-600 mt-1">Пройдено</div>
            {completedResults.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">{passRate}% успеха</div>
            )}
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className="text-2xl font-bold text-red-600">{failedResults}</div>
            <div className="text-sm text-gray-600 mt-1">Не пройдено</div>
            {inProgressResults > 0 && (
              <div className="text-xs text-gray-500 mt-1">{inProgressResults} в процессе</div>
            )}
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className="text-2xl font-bold text-blue-600">
              {validScores.length > 0 ? `${averageScore}%` : '—'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Средний балл</div>
            {validScores.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">из {validScores.length} тестов</div>
            )}
          </div>
        </div>

        {/* Список результатов */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Результаты сотрудников</h3>
            <p className="text-sm text-gray-600 mt-1">Детальная информация о прохождениях теста</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Сотрудник
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Балл
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Время
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Завершен
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Пока нет результатов прохождения теста
                    </td>
                  </tr>
                ) : (
                  results.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {result.user.firstName} {result.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{result.user.email}</div>
                          {result.user.position && (
                            <div className="text-xs text-gray-400">{result.user.position}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-semibold ${
                          result.score >= test.passingScore ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.score}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.status)}
                          <span className="text-sm text-gray-900">{getStatusText(result.status)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.timeSpent ? `${Math.round(result.timeSpent / 60)} мин.` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.completedAt ? formatDate(result.completedAt) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
