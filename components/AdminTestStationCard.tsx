'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FolderTree, ChevronUp, ChevronDown, FileText } from 'lucide-react'
import TestDeleteButton from '@/components/TestDeleteButton'

interface Test {
  id: string
  title: string
  description: string | null
  passingScore: number
  timeLimit: number | null
  _count: {
    questions: number
    results: number
  }
}

interface Section {
  id: string
  title: string
  description: string | null
  tests: Test[]
}

interface AdminTestStationCardProps {
  station: {
    id: string
    name: string
    description: string | null
    sections: Section[]
  }
  stationTestsCount: number
}

export function AdminTestStationCard({ station, stationTestsCount }: AdminTestStationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Собираем все тесты из всех разделов в один массив
  const allTests = station.sections.flatMap(section => section.tests)

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Заголовок станции с кнопкой */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200 p-4 sm:p-6 hover:from-purple-100 hover:to-indigo-100 transition-colors text-left"
      >
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <FolderTree className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{stationTestsCount} тестов</span>
                  </span>
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
          {allTests.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              Тесты пока не добавлены
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {allTests.map((test) => (
                <div key={test.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{test.title}</h4>
                        {test._count.questions === 0 && (
                          <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                            Нет вопросов
                          </span>
                        )}
                      </div>
                      {test.description && (
                        <p className="text-gray-600 mb-3 text-sm">{test.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 text-sm mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Проходной балл:</span>
                      <span className="font-semibold text-gray-900">{test.passingScore}%</span>
                    </div>
                    {test.timeLimit ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Лимит времени:</span>
                        <span className="font-semibold text-gray-900">{test.timeLimit} мин.</span>
                      </div>
                    ) : (
                      <div className="text-gray-500">Без лимита времени</div>
                    )}
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Вопросов:</span>
                      <span className={`font-semibold ${test._count.questions === 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                        {test._count.questions}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Прохождений:</span>
                      <span className="font-semibold text-gray-900">{test._count.results}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-wrap gap-2">
                    <Link
                      href={`/admin/tests/${test.id}/questions`}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                    >
                      Вопросы ({test._count.questions})
                    </Link>
                    <Link
                      href={`/admin/tests/${test.id}/results`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                    >
                      Результаты ({test._count.results})
                    </Link>
                    <Link
                      href={`/admin/tests/${test.id}/edit`}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
                    >
                      Редактировать
                    </Link>
                    <TestDeleteButton testId={test.id} testTitle={test.title} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

