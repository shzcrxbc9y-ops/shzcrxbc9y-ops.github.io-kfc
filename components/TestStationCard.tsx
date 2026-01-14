'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Award, Clock, CheckCircle, XCircle, Building2, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Test {
  id: string
  title: string
  description: string | null
  passingScore: number
  timeLimit: number | null
  _count: {
    questions: number
  }
}

interface TestResult {
  testId: string
  score: number | null
  status: string | null
  completedAt: Date | string | null
}

interface Station {
  id: string
  name: string
  description: string | null
  tests: (Test & { result?: TestResult })[]
}

interface TestStationCardProps {
  station: Station
}

export function TestStationCard({ station }: TestStationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const totalQuestions = station.tests.reduce((sum, test) => sum + (test._count.questions || 0), 0)
  const passedTests = station.tests.filter(t => t.result?.status === 'PASSED').length
  const failedTests = station.tests.filter(t => t.result?.status === 'FAILED').length
  const inProgressTests = station.tests.filter(t => t.result?.status === 'IN_PROGRESS').length

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Заголовок станции с кнопкой */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 p-4 sm:p-6 hover:from-purple-100 hover:to-pink-100 transition-colors text-left"
      >
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">{station.name}</h2>
                {station.description && (
                  <p className="text-sm sm:text-base text-gray-700 mb-3">{station.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{station.tests.length} {station.tests.length === 1 ? 'тест' : 'тестов'}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="mr-1">❓</span>
                    <span>{totalQuestions} вопросов</span>
                  </span>
                  {passedTests > 0 && (
                    <span className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{passedTests} пройдено</span>
                    </span>
                  )}
                  {failedTests > 0 && (
                    <span className="flex items-center space-x-1 text-red-600">
                      <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{failedTests} не пройдено</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                {isExpanded ? (
                  <ChevronUp className="w-6 h-6 text-gray-600" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-600" />
                )}
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Тесты (показываются при раскрытии) */}
      {isExpanded && (
        <div className="p-4 sm:p-6">
          {station.tests.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              Тесты для этой станции пока не добавлены
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {station.tests.map((test) => {
                const result = test.result
                const isPassed = result?.status === 'PASSED'
                const isFailed = result?.status === 'FAILED'
                const isCompleted = result?.status === 'COMPLETED'
                const isInProgress = result?.status === 'IN_PROGRESS'

                return (
                  <div
                    key={test.id}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{test.title}</h3>
                          {isPassed && (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          )}
                          {isFailed && (
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          )}
                          {isInProgress && (
                            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                          )}
                        </div>
                        {test.description && (
                          <p className="text-gray-600 mb-3 text-sm">{test.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                            {result.score !== null && result.score !== undefined ? `${result.score}%` : '—'}
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
                          : isInProgress
                          ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {isPassed
                        ? 'Просмотреть результаты'
                        : isFailed || isCompleted
                        ? 'Повторить тест'
                        : isInProgress
                        ? 'Продолжить тест'
                        : 'Начать тест'}
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
