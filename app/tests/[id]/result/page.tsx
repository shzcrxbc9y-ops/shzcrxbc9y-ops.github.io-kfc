import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Award } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default async function TestResultPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const test = await prisma.test.findUnique({
    where: { id: params.id },
    include: {
      section: {
        include: {
          station: true,
        },
      },
    },
  })

  if (!test) {
    notFound()
  }

  const result = await prisma.testResult.findFirst({
    where: {
      userId: user.id,
      testId: params.id,
    },
    include: {
      answers: true,
    },
    orderBy: { completedAt: 'desc' },
  })

  if (!result) {
    redirect(`/tests/${params.id}`)
  }

  const isPassed = result.status === 'PASSED'
  const questions = await prisma.question.findMany({
    where: { testId: params.id },
    include: {
      options: true,
    },
    orderBy: { order: 'asc' },
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/tests"
        className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Назад к тестам</span>
      </Link>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          {isPassed ? (
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          )}
          <h1 className="text-3xl font-bold mb-2">
            {isPassed ? 'Тест пройден!' : 'Тест не пройден'}
          </h1>
          <p className="text-2xl font-semibold text-primary-600 mb-2">
            Ваш результат: {result.score}%
          </p>
          <p className="text-gray-600">
            Проходной балл: {test.passingScore}%
          </p>
          {result.completedAt && (
            <p className="text-sm text-gray-500 mt-2">
              Завершено: {formatDateTime(result.completedAt)}
            </p>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Детали ответов:</h2>
          {questions.map((question, index) => {
            const answer = result.answers.find((a) => a.questionId === question.id)
            const selectedOptionIds = answer ? JSON.parse(answer.optionIds) : []
            const isCorrect = answer?.isCorrect ?? false

            return (
              <div
                key={question.id}
                className={`border rounded-lg p-4 ${
                  isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold flex-1">
                    {index + 1}. {question.text}
                  </h3>
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 ml-2" />
                  )}
                </div>
                <div className="space-y-2">
                  {question.options.map((option) => {
                    const isSelected = selectedOptionIds.includes(option.id)
                    const isCorrectOption = option.isCorrect

                    return (
                      <div
                        key={option.id}
                        className={`p-2 rounded ${
                          isCorrectOption
                            ? 'bg-green-100 border border-green-300'
                            : isSelected
                            ? 'bg-red-100 border border-red-300'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {isCorrectOption && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          {isSelected && !isCorrectOption && (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span
                            className={
                              isCorrectOption
                                ? 'font-semibold text-green-800'
                                : isSelected
                                ? 'font-semibold text-red-800'
                                : ''
                            }
                          >
                            {option.text}
                          </span>
                          {isCorrectOption && (
                            <span className="text-xs text-green-600 ml-auto">Правильный ответ</span>
                          )}
                          {isSelected && !isCorrectOption && (
                            <span className="text-xs text-red-600 ml-auto">Ваш ответ</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href="/tests"
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            К списку тестов
          </Link>
          {!isPassed && (
            <Link
              href={`/tests/${params.id}`}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Попробовать снова
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

