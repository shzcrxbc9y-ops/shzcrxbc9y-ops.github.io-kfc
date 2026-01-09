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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Тесты и сертификация</h1>

      {tests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">Тесты пока не добавлены. Обратитесь к администратору.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {tests.map((test) => {
            const result = resultsMap.get(test.id)
            const isPassed = result?.status === 'PASSED'
            const isFailed = result?.status === 'FAILED'
            const isCompleted = result?.status === 'COMPLETED'

            return (
              <div
                key={test.id}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary-600"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">{test.title}</h2>
                    {test.description && (
                      <p className="text-gray-600 mb-2">{test.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        {test.section.station?.name} → {test.section.title}
                      </span>
                      <span>{test._count.questions} вопросов</span>
                    </div>
                  </div>
                  {isPassed && (
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  )}
                  {isFailed && (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Проходной балл:</span>
                    <span className="font-semibold">{test.passingScore}%</span>
                  </div>
                  {test.timeLimit && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Лимит времени: {test.timeLimit} мин.</span>
                    </div>
                  )}
                  {test.isCertification && (
                    <div className="flex items-center space-x-2 text-sm text-primary-600">
                      <Award className="w-4 h-4" />
                      <span className="font-semibold">Сертификационный тест</span>
                    </div>
                  )}
                </div>

                {result && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Результат:</span>
                      <span className={`font-semibold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                        {result.score}%
                      </span>
                    </div>
                    {result.completedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        Завершено: {formatDate(result.completedAt)}
                      </div>
                    )}
                  </div>
                )}

                <Link
                  href={`/tests/${test.id}`}
                  className={`block w-full text-center py-2 px-4 rounded-lg font-semibold transition-colors ${
                    isPassed
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : isFailed || isCompleted
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
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
  )
}

