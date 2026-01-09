import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Award, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function TestsPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const tests = await prisma.test.findMany({
    include: {
      section: {
        include: {
          station: true,
        },
      },
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const testResults = await prisma.testResult.findMany({
    where: { userId: user.id },
    select: {
      testId: true,
      score: true,
      status: true,
      completedAt: true,
    },
  })

  const resultsMap = new Map(
    testResults.map((result) => [result.testId, result])
  )

  // Статистика - безопасный расчет с проверками
  const totalTests = tests.length || 0
  const completedResults = testResults.filter(r => r.status && (r.status === 'PASSED' || r.status === 'FAILED' || r.status === 'COMPLETED'))
  const passedTests = testResults.filter(r => r.status === 'PASSED').length || 0
  const failedTests = testResults.filter(r => r.status === 'FAILED').length || 0
  const inProgressTests = testResults.filter(r => r.status === 'IN_PROGRESS').length || 0
  
  // Средний балл только для завершенных тестов с валидным score
  const validScores = completedResults.filter(r => typeof r.score === 'number' && !isNaN(r.score) && r.score >= 0 && r.score <= 100)
  const averageScore = validScores.length > 0
    ? Math.round(validScores.reduce((sum, r) => sum + (r.score || 0), 0) / validScores.length)
    : 0
  
  // Процент успеха
  const successRate = completedResults.length > 0
    ? Math.round((passedTests / completedResults.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Заголовок */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Тесты</h1>
          <p className="text-gray-600 mt-1 text-xs sm:text-sm">Проверьте свои знания с помощью тестов</p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Всего тестов</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{totalTests}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Пройдено</div>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{passedTests}</div>
              {completedResults.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">{successRate}% успеха</div>
              )}
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Не пройдено</div>
              <div className="text-xl sm:text-2xl font-bold text-red-600">{failedTests}</div>
              {inProgressTests > 0 && (
                <div className="text-xs text-gray-500 mt-1">{inProgressTests} в процессе</div>
              )}
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Средний балл</div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {validScores.length > 0 ? `${averageScore}%` : '—'}
              </div>
              {validScores.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">из {validScores.length} попыток</div>
              )}
            </div>
        </div>

        {/* Список тестов */}
        {tests.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Award className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет доступных тестов</h3>
            <p className="text-gray-600">Тесты пока не добавлены. Обратитесь к администратору.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {tests.map((test) => {
              const result = resultsMap.get(test.id)
              const isPassed = result?.status === 'PASSED'
              const isFailed = result?.status === 'FAILED'
              const isCompleted = result?.status === 'COMPLETED'

              return (
                <div
                  key={test.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900">{test.title}</h2>
                        {isPassed && (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        )}
                        {isFailed && (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        )}
                      </div>
                      {test.description && (
                        <p className="text-gray-600 mb-3 text-sm">{test.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <span className="mr-1">📍</span>
                          {test.section.station?.name} → {test.section.title}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">❓</span>
                          {test._count.questions} вопросов
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Проходной балл:</span>
                      <span className="font-semibold text-gray-900">{test.passingScore}%</span>
                    </div>
                    {test.timeLimit && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Лимит времени: {test.timeLimit} мин.</span>
                      </div>
                    )}
                  </div>

                  {result && (
                    <div className={`mb-4 p-3 rounded border ${
                      isPassed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">Результат:</span>
                        <span className={`font-bold text-lg ${
                          isPassed ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {result.score}%
                        </span>
                      </div>
                      {result.completedAt && (
                        <div className="text-xs text-gray-600">
                          Завершено: {formatDate(result.completedAt)}
                        </div>
                      )}
                    </div>
                  )}

                  <Link
                    href={`/tests/${test.id}`}
                    className={`block w-full text-center py-3 px-4 rounded-md font-semibold transition-colors shadow-sm hover:shadow-md ${
                      isPassed
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : isFailed || isCompleted
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {isPassed
                      ? 'Просмотреть результаты'
                      : isFailed || isCompleted
                      ? 'Повторить тест'
                      : 'Начать тест'}
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

