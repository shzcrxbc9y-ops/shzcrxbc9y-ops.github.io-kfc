import { getCurrentUser } from '@/lib/auth'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Users, BookOpen, Award, BarChart3, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react'

export default async function AdminStatisticsPage() {
  try {
    await requireAuth('ADMIN')
  } catch {
    redirect('/dashboard')
  }

  const totalUsers = await prisma.user.count()
  const totalTests = await prisma.test.count()
  const totalMaterials = await prisma.material.count()
  const totalSections = await prisma.section.count()
  const totalStations = await prisma.station.count()

  const testResults = await prisma.testResult.findMany({
    include: {
      test: true,
      user: true,
    },
  })

  // Безопасный расчет статистики тестов
  const completedResults = testResults.filter(r => r.status && (r.status === 'PASSED' || r.status === 'FAILED' || r.status === 'COMPLETED'))
  const passedTests = testResults.filter((r) => r.status === 'PASSED').length || 0
  const failedTests = testResults.filter((r) => r.status === 'FAILED').length || 0
  const inProgressTests = testResults.filter((r) => r.status === 'IN_PROGRESS').length || 0
  
  // Средний балл только для завершенных тестов с валидным score
  const validScores = completedResults.filter(r => 
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
  
  // Процент успеха только для завершенных тестов
  const passRate = completedResults.length > 0 
    ? Math.round((passedTests / completedResults.length) * 100) 
    : 0


  // Статистика по материалам
  const materialsByType = await prisma.material.groupBy({
    by: ['type'],
    _count: true,
  })

  // Топ пользователей по активности
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          testResults: true,
        },
      },
      progress: true,
    },
  })

  const topUsers = users
    .map(u => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      testsCompleted: u._count.testResults,
      level: u.progress?.level || 1,
      experience: u.progress?.experience || 0,
    }))
    .sort((a, b) => b.testsCompleted - a.testsCompleted)
    .slice(0, 5)

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
              <h1 className="text-2xl font-semibold text-gray-900">Статистика и аналитика</h1>
              <p className="text-gray-600 mt-1 text-sm">Обзор системы обучения и метрики эффективности</p>
            </div>
          </div>
        </div>

        {/* Основные метрики */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <StatCard 
            title="Пользователей" 
            value={totalUsers.toString()} 
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <StatCard 
            title="Тестов" 
            value={totalTests.toString()} 
            icon={<Award className="w-5 h-5" />}
            color="purple"
          />
          <StatCard 
            title="Материалов" 
            value={totalMaterials.toString()} 
            icon={<BookOpen className="w-5 h-5" />}
            color="green"
          />
          <StatCard 
            title="Разделов" 
            value={totalSections.toString()} 
            icon={<BarChart3 className="w-5 h-5" />}
            color="orange"
          />
          <StatCard 
            title="Станций" 
            value={totalStations.toString()} 
            icon={<BarChart3 className="w-5 h-5" />}
            color="indigo"
          />
        </div>

        {/* Статистика тестов */}
        <div className="grid md:grid-cols-1 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Статистика тестов</h2>
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Всего попыток:</span>
                <span className="font-semibold text-gray-900">{testResults.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Завершено:</span>
                <span className="font-semibold text-gray-900">{completedResults.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Пройдено успешно:</span>
                </div>
                <span className="font-semibold text-green-600">{passedTests}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-gray-600">Не пройдено:</span>
                </div>
                <span className="font-semibold text-red-600">{failedTests}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">В процессе:</span>
                </div>
                <span className="font-semibold text-blue-600">{inProgressTests}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-600">Процент успеха:</span>
                </div>
                <span className="font-semibold text-purple-600">{passRate}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Средний балл:</span>
                <span className="font-semibold text-gray-900">
                  {validScores.length > 0 ? `${averageScore}%` : '—'}
                </span>
              </div>
              {validScores.length > 0 && (
                <div className="text-xs text-gray-500 px-3">
                  Рассчитано из {validScores.length} завершенных тестов
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Топ тестов и активные пользователи */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Топ тестов по популярности</h2>
            <div className="space-y-2">
              {testResults.length === 0 ? (
                <p className="text-gray-500 text-sm">Нет данных</p>
              ) : (
                <TestPopularityList testResults={testResults} />
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Самые активные пользователи</h2>
            <div className="space-y-2">
              {topUsers.length === 0 ? (
                <p className="text-gray-500 text-sm">Нет данных</p>
              ) : (
                <TopUsersList users={topUsers} />
              )}
            </div>
          </div>
        </div>

        {/* Статистика по материалам */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Материалы по типам</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {materialsByType.length === 0 ? (
              <p className="text-gray-500 text-sm col-span-full">Нет данных</p>
            ) : (
              materialsByType.map((item) => (
                <div key={item.type} className="p-4 bg-gray-50 rounded border border-gray-200">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{item._count}</div>
                  <div className="text-sm text-gray-600 capitalize">
                    {item.type === 'video' ? 'Видео' :
                     item.type === 'image' ? 'Изображения' :
                     item.type === 'audio' ? 'Аудио' :
                     item.type === 'pdf' ? 'PDF' :
                     item.type === 'file' ? 'Файлы' :
                     'Текст'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon, 
  color = 'blue' 
}: { 
  title: string
  value: string
  icon?: React.ReactNode
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'indigo'
}) {
  const colorClasses = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    indigo: 'text-indigo-600',
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        {icon && <div className={colorClasses[color]}>{icon}</div>}
      </div>
      <div className={`text-2xl font-bold ${colorClasses[color]} mb-1`}>{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  )
}

function TestPopularityList({ testResults }: { testResults: any[] }) {
  const testCounts = new Map<string, { count: number; name: string }>()

  testResults.forEach((result) => {
    const testId = result.testId
    const testName = result.test?.title || 'Неизвестный тест'
    const current = testCounts.get(testId) || { count: 0, name: testName }
    testCounts.set(testId, { count: current.count + 1, name: testName })
  })

  const sorted = Array.from(testCounts.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return (
    <div className="space-y-2">
      {sorted.map((item, index) => (
        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors">
          <div className="flex items-center space-x-3 flex-1">
            <span className={`text-sm font-bold w-6 text-center ${
              index === 0 ? 'text-yellow-600' :
              index === 1 ? 'text-gray-500' :
              index === 2 ? 'text-orange-600' :
              'text-gray-400'
            }`}>
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
            </span>
            <span className="text-sm text-gray-900 flex-1 truncate">{item.name}</span>
          </div>
          <span className="text-sm font-semibold text-gray-600 ml-2">{item.count}</span>
        </div>
      ))}
    </div>
  )
}

function TopUsersList({ users }: { users: Array<{
  id: string
  name: string
  email: string
  testsCompleted: number
  level: number
  experience: number
}> }) {
  return (
    <div className="space-y-2">
      {users.map((user, index) => (
        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors">
          <div className="flex items-center space-x-3 flex-1">
            <span className={`text-sm font-bold w-6 text-center ${
              index === 0 ? 'text-yellow-600' :
              index === 1 ? 'text-gray-500' :
              index === 2 ? 'text-orange-600' :
              'text-gray-400'
            }`}>
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
              <div className="text-xs text-gray-500 truncate">{user.email}</div>
            </div>
          </div>
          <div className="text-right ml-2">
            <div className="text-sm font-semibold text-gray-900">{user.testsCompleted}</div>
            <div className="text-xs text-gray-500">Уровень {user.level}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

