import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Award } from 'lucide-react'
import { TestStationCard } from '@/components/TestStationCard'

export default async function TestsPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  // Получаем все станции с их тестами
  const stations = await prisma.station.findMany({
    include: {
      sections: {
        include: {
          tests: {
            include: {
              _count: {
                select: { questions: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
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

  // Группируем тесты по станциям (игнорируя разделы)
  const stationsWithTests = stations
    .map((station) => {
      // Собираем все тесты из всех разделов станции
      const allTests = station.sections.flatMap((section) =>
        section.tests.map((test) => ({
          ...test,
          result: resultsMap.get(test.id) || undefined,
        }))
      )

      return {
        id: station.id,
        name: station.name,
        description: station.description,
        tests: allTests,
      }
    })
    .filter((station) => station.tests.length > 0) // Показываем только станции с тестами

  // Подсчитываем общую статистику для всех тестов
  const allTests = stationsWithTests.flatMap((s) => s.tests)

  // Статистика - безопасный расчет с проверками
  const totalTests = allTests.length || 0
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

        {/* Список тестов по станциям */}
        {stationsWithTests.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Award className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет доступных тестов</h3>
            <p className="text-gray-600">Тесты пока не добавлены. Обратитесь к администратору.</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {stationsWithTests.map((station) => (
              <TestStationCard key={station.id} station={station} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

