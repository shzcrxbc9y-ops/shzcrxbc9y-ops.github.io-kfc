import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Award, BookOpen, BarChart3, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const progress = await prisma.progress.findUnique({
    where: { userId: user.id },
  })

  const testResults = await prisma.testResult.findMany({
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
    take: 5,
  })

  const certifications = await prisma.certification.findMany({
    where: { userId: user.id },
    include: {
      station: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  const totalTests = await prisma.test.count()
  const passedTests = testResults.filter((r) => r.status === 'PASSED').length
  const totalSections = await prisma.section.count()
  const completedSections = progress?.sectionsCompleted || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        Личный кабинет: {user.firstName} {user.lastName}
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<BookOpen className="w-6 h-6" />}
          title="Разделы изучено"
          value={`${completedSections}/${totalSections}`}
          color="blue"
        />
        <StatCard
          icon={<Award className="w-6 h-6" />}
          title="Тесты пройдено"
          value={`${passedTests}/${totalTests}`}
          color="green"
        />
        <StatCard
          icon={<BarChart3 className="w-6 h-6" />}
          title="Средний балл"
          value={
            testResults.length > 0
              ? `${Math.round(testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length)}%`
              : '—'
          }
          color="purple"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Уровень"
          value={`${progress?.level || 1}`}
          color="orange"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Последние результаты тестов</h2>
          {testResults.length === 0 ? (
            <p className="text-gray-500">Вы еще не проходили тесты</p>
          ) : (
            <div className="space-y-3">
              {testResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <div className="font-medium">{result.test.title}</div>
                    <div className="text-sm text-gray-500">
                      {result.test.section.station?.name} → {result.test.section.title}
                    </div>
                    {result.completedAt && (
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(result.completedAt)}
                      </div>
                    )}
                  </div>
                  <div
                    className={`font-semibold ${
                      result.status === 'PASSED'
                        ? 'text-green-600'
                        : result.status === 'FAILED'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {result.score}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Сертификации</h2>
          {certifications.length === 0 ? (
            <p className="text-gray-500">У вас пока нет сертификаций</p>
          ) : (
            <div className="space-y-3">
              {certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <div className="font-medium">{cert.station.name}</div>
                    <div
                      className={`text-sm ${
                        cert.status === 'PASSED'
                          ? 'text-green-600'
                          : cert.status === 'FAILED'
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {cert.status === 'PASSED'
                        ? 'Пройдена'
                        : cert.status === 'FAILED'
                        ? 'Не пройдена'
                        : cert.status === 'IN_PROGRESS'
                        ? 'В процессе'
                        : 'Не начата'}
                    </div>
                    {cert.completedAt && (
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(cert.completedAt)}
                      </div>
                    )}
                  </div>
                  {cert.score && (
                    <div className="font-semibold text-primary-600">{cert.score}%</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  color,
}: {
  icon: React.ReactNode
  title: string
  value: string
  color: string
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
        {icon}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-gray-600 mt-1">{title}</div>
      </div>
    </div>
  )
}

