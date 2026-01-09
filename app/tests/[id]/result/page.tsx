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
  
  // Безопасная проверка score
  const resultScore = (result.score !== null && result.score !== undefined && typeof result.score === 'number' && !isNaN(result.score) && result.score >= 0 && result.score <= 100) 
    ? result.score 
    : 0
  
  const questions = await prisma.question.findMany({
    where: { testId: params.id },
    include: {
      options: true,
    },
    orderBy: { order: 'asc' },
  })
  
  // Безопасный подсчет правильных ответов
  const correctAnswers = questions.filter((q) => {
    if (!q || !q.id) return false
    const answer = result.answers.find((a) => a && a.questionId === q.id)
    return answer && answer.isCorrect === true
  }).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <Link
            href="/tests"
            className="text-gray-600 hover:text-gray-900 text-sm mb-2 inline-block transition-colors font-medium"
          >
            ← Назад к тестам
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">{test.title}</h1>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-6">
          <div className="text-center">
            {isPassed ? (
              <div className="mb-6">
                <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-green-700 mb-2">Тест пройден!</h2>
              </div>
            ) : (
              <div className="mb-6">
                <XCircle className="w-20 h-20 text-red-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-red-700 mb-2">Тест не пройден</h2>
              </div>
            )}
            <div className={`inline-block px-6 py-3 rounded-lg mb-4 ${
              isPassed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <p className={`text-4xl font-bold mb-1 ${
                isPassed ? 'text-green-700' : 'text-red-700'
              }`}>
                {resultScore}%
              </p>
              <p className="text-sm text-gray-600">
                Правильных ответов: {correctAnswers} из {questions.length}
              </p>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Проходной балл: <strong>{test.passingScore || 0}%</strong></p>
              {result.completedAt && (
                <p>Завершено: {formatDateTime(result.completedAt)}</p>
              )}
              {result.timeSpent && typeof result.timeSpent === 'number' && result.timeSpent > 0 && (
                <p>Время прохождения: {Math.round(result.timeSpent / 60)} мин.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Детали ответов</h2>
          <div className="space-y-4">
            {questions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Вопросы не найдены</p>
            ) : (
              questions
                .filter(q => q && q.id) // Фильтруем валидные вопросы
                .map((question, index) => {
                  const answer = result.answers.find((a) => a && a.questionId === question.id)
                  let selectedOptionIds: string[] = []
                  
                  // Безопасный парсинг JSON
                  try {
                    if (answer && answer.optionIds) {
                      const parsed = JSON.parse(answer.optionIds)
                      selectedOptionIds = Array.isArray(parsed) ? parsed : []
                    }
                  } catch (e) {
                    // Если не удалось распарсить, оставляем пустой массив
                    selectedOptionIds = []
                  }
                  
                  const isCorrect = answer ? (answer.isCorrect === true) : false

                  return (
                <div
                  key={question.id}
                  className={`p-5 rounded-lg border-2 ${
                    isCorrect 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-red-50 border-red-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3 flex-1">
                      <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                        isCorrect ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {index + 1}
                      </span>
                      <h3 className="font-semibold text-gray-900 flex-1">
                        {question.text}
                      </h3>
                    </div>
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 ml-2" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <div className="space-y-2 ml-11">
                    {question.options.map((option) => {
                      const isSelected = selectedOptionIds.includes(option.id)
                      const isCorrectOption = option.isCorrect

                      return (
                        <div
                          key={option.id}
                          className={`p-3 rounded border-2 ${
                            isCorrectOption
                              ? 'bg-green-100 border-green-400'
                              : isSelected
                              ? 'bg-red-100 border-red-400'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {isCorrectOption && (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            )}
                            {isSelected && !isCorrectOption && (
                              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            )}
                            {!isCorrectOption && !isSelected && (
                              <div className="w-5 h-5 flex-shrink-0"></div>
                            )}
                            <span
                              className={`flex-1 ${
                                isCorrectOption
                                  ? 'font-semibold text-green-800'
                                  : isSelected
                                  ? 'font-semibold text-red-800'
                                  : 'text-gray-700'
                              }`}
                            >
                              {option.text}
                            </span>
                            {isCorrectOption && (
                              <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded">
                                Правильный
                              </span>
                            )}
                            {isSelected && !isCorrectOption && (
                              <span className="text-xs font-medium text-red-700 bg-red-200 px-2 py-1 rounded">
                                Ваш ответ
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                  )
                })
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-center space-x-4">
          <Link
            href="/tests"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition-colors shadow-sm"
          >
            К списку тестов
          </Link>
          {!isPassed && (
            <Link
              href={`/tests/${params.id}`}
              className="px-6 py-3 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 transition-colors shadow-sm hover:shadow-md"
            >
              Попробовать снова
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

