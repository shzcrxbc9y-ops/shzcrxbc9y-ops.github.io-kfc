import { getCurrentUser } from '@/lib/auth'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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

  const testResults = await prisma.testResult.findMany({
    include: {
      test: true,
      user: true,
    },
  })

  const averageScore =
    testResults.length > 0
      ? Math.round(
          testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length
        )
      : 0

  const passedTests = testResults.filter((r) => r.status === 'PASSED').length
  const failedTests = testResults.filter((r) => r.status === 'FAILED').length

  const certifications = await prisma.certification.findMany({
    include: {
      station: true,
      user: true,
    },
  })

  const passedCertifications = certifications.filter(
    (c) => c.status === 'PASSED'
  ).length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад</span>
        </Link>
        <h1 className="text-3xl font-bold">Статистика и аналитика</h1>
        <div></div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Всего пользователей" value={totalUsers.toString()} />
        <StatCard title="Всего тестов" value={totalTests.toString()} />
        <StatCard title="Материалов" value={totalMaterials.toString()} />
        <StatCard title="Разделов" value={totalSections.toString()} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Статистика тестов</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Всего пройдено:</span>
              <span className="font-semibold">{testResults.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Пройдено успешно:</span>
              <span className="font-semibold text-green-600">{passedTests}</span>
            </div>
            <div className="flex justify-between">
              <span>Не пройдено:</span>
              <span className="font-semibold text-red-600">{failedTests}</span>
            </div>
            <div className="flex justify-between">
              <span>Средний балл:</span>
              <span className="font-semibold">{averageScore}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Сертификации</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Всего:</span>
              <span className="font-semibold">{certifications.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Пройдено:</span>
              <span className="font-semibold text-green-600">
                {passedCertifications}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Процент успеха:</span>
              <span className="font-semibold">
                {certifications.length > 0
                  ? Math.round(
                      (passedCertifications / certifications.length) * 100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Топ тестов по популярности</h2>
        <div className="space-y-2">
          {testResults.length === 0 ? (
            <p className="text-gray-500">Нет данных</p>
          ) : (
            <TestPopularityList testResults={testResults} />
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-3xl font-bold text-primary-600 mb-2">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  )
}

function TestPopularityList({ testResults }: { testResults: any[] }) {
  const testCounts = new Map<string, { count: number; name: string }>()

  testResults.forEach((result) => {
    const testId = result.testId
    const testName = result.test.title
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
        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div className="flex items-center space-x-3">
            <span className="text-lg font-bold text-primary-600 w-8">{index + 1}</span>
            <span>{item.name}</span>
          </div>
          <span className="text-sm text-gray-600">{item.count} прохождений</span>
        </div>
      ))}
    </div>
  )
}

