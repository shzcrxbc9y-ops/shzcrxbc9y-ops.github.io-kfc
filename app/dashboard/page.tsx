import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Award, 
  BookOpen, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Settings,
  Target
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const progress = await prisma.progress.findUnique({
    where: { userId: user.id },
  })

  const allTestResults = await prisma.testResult.findMany({
    where: { userId: user.id },
    include: {
      test: {
        include: {
          section: {
            include: {
              station: true,
            },
          },
        },
      },
    },
    orderBy: { completedAt: 'desc' },
  })

  const recentTestResults = allTestResults.slice(0, 5)


  // Доступные тесты (еще не пройденные)
  const allTests = await prisma.test.findMany({
    include: {
      section: {
        include: {
          station: true,
        },
      },
      _count: {
        select: {
          questions: true,
        },
      },
    },
  })

  const availableTests = allTests.filter(test => {
    const userResult = allTestResults.find(r => r.testId === test.id)
    return !userResult || userResult.status === 'FAILED'
  }).slice(0, 3)

  // Безопасный расчет статистики
  const totalTests = allTests.length || 0
  const completedTestResults = allTestResults.filter(r => r.status && (r.status === 'PASSED' || r.status === 'FAILED' || r.status === 'COMPLETED'))
  const passedTests = allTestResults.filter((r) => r.status === 'PASSED').length || 0
  const totalSections = await prisma.section.count() || 0
  const completedSections = (progress?.sectionsCompleted && progress.sectionsCompleted >= 0) ? progress.sectionsCompleted : 0
  
  // Средний балл только для завершенных тестов с валидным score
  const validScores = completedTestResults.filter(r => typeof r.score === 'number' && !isNaN(r.score) && r.score >= 0 && r.score <= 100)
  const averageScore = validScores.length > 0
    ? Math.round(validScores.reduce((sum, r) => sum + (r.score || 0), 0) / validScores.length)
    : 0
  
  // Процент изучения разделов
  const sectionsProgress = totalSections > 0
    ? Math.round((completedSections / totalSections) * 100)
    : 0
  
  // Процент пройденных тестов
  const testsProgress = totalTests > 0
    ? Math.round((passedTests / totalTests) * 100)
    : 0

  const isAdmin = user.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Заголовок */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Личный кабинет
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                {user.firstName} {user.lastName} {user.position && `• ${user.position}`}
              </p>
            </div>
            {isAdmin && (
              <Link
                href="/admin"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-2 text-sm font-medium shadow-sm"
              >
                <Settings className="w-4 h-4" />
                <span>Админ-панель</span>
              </Link>
            )}
          </div>
        </div>

        {/* Основные метрики */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            title="Разделы"
            value={`${completedSections}/${totalSections}`}
            subtitle={`${sectionsProgress}% изучено`}
            color="blue"
          />
          <StatCard
            icon={<Award className="w-5 h-5" />}
            title="Тесты"
            value={`${passedTests}/${totalTests}`}
            subtitle={`${testsProgress}% пройдено`}
            color="green"
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5" />}
            title="Средний балл"
            value={validScores.length > 0 ? `${averageScore}%` : '—'}
            subtitle={validScores.length > 0 ? `${validScores.length} попыток` : 'Нет результатов'}
            color="purple"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            title="Уровень"
            value={`${progress?.level || 1}`}
            subtitle={`${progress?.experience || 0} опыта`}
            color="orange"
          />
        </div>

        {/* Быстрые действия */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <QuickActionCard
            title="Продолжить обучение"
            description="Изучайте материалы и повышайте свой уровень"
            href="/learning"
            icon={<BookOpen className="w-5 h-5" />}
            color="blue"
          />
          <QuickActionCard
            title="Пройти тест"
            description="Проверьте свои знания с помощью тестов"
            href="/tests"
            icon={<Award className="w-5 h-5" />}
            color="green"
          />
          {isAdmin && (
            <QuickActionCard
              title="Управление системой"
              description="Администрирование контента и пользователей"
              href="/admin"
              icon={<Settings className="w-5 h-5" />}
              color="purple"
            />
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Рекомендуемые тесты */}
          {availableTests.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span>Рекомендуемые тесты</span>
                </h2>
                <Link
                  href="/tests"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Все тесты →
                </Link>
              </div>
              <div className="space-y-3">
                {availableTests.map((test) => (
                  <Link
                    key={test.id}
                    href={`/tests/${test.id}`}
                    className="block p-4 bg-gray-50 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">{test.title}</div>
                        <div className="text-sm text-gray-600">
                          {test.section.station?.name} → {test.section.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {test._count.questions} вопросов
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Последние результаты */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span>Последние результаты</span>
              </h2>
              {recentTestResults.length > 0 && (
                <Link
                  href="/tests"
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Все результаты →
                </Link>
              )}
            </div>
            {recentTestResults.length === 0 ? (
              <div className="text-center py-8">
                <Award className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 text-sm mb-3">Вы еще не проходили тесты</p>
                <Link
                  href="/tests"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  Пройти первый тест
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTestResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-4 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">{result.test.title}</div>
                        <div className="text-sm text-gray-600">
                          {result.test.section.station?.name} → {result.test.section.title}
                        </div>
                        {result.completedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(result.completedAt)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-3">
                        {result.status === 'PASSED' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : result.status === 'FAILED' ? (
                          <XCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-600" />
                        )}
                        <span
                          className={`font-semibold text-lg ${
                            result.status === 'PASSED'
                              ? 'text-green-600'
                              : result.status === 'FAILED'
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {result.score}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode
  title: string
  value: string
  subtitle?: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className={`${colorClasses[color]} mb-2`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm font-medium text-gray-700">{title}</div>
      {subtitle && (
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
      )}
    </div>
  )
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
  color,
}: {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
  }

  return (
    <Link
      href={href}
      className={`${colorClasses[color]} text-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all group`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="bg-white/20 p-2 rounded-lg">
          {icon}
        </div>
        <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-white/90">{description}</p>
    </Link>
  )
}

