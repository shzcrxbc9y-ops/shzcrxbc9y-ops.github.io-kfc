'use client'

import Link from 'next/link'
import TestDeleteButton from './TestDeleteButton'
import TestsListToggle from './TestsListToggle'

interface Test {
  id: string
  title: string
  description: string | null
  passingScore: number
  timeLimit: number | null
  section: {
    title: string
    station: {
      name: string
    } | null
  }
  _count: {
    questions: number
    results: number
  }
}

interface TestsListProps {
  tests: Test[]
}

export default function TestsList({ tests }: TestsListProps) {
  if (tests.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Нет тестов</h3>
        <p className="text-gray-600 mb-4">Создайте первый тест для начала работы</p>
        <Link
          href="/admin/tests/new"
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          Создать тест
        </Link>
      </div>
    )
  }

  return (
    <TestsListToggle title="Список тестов">
      <div className="space-y-4 mt-4">
        {tests.map((test) => (
          <div key={test.id} className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-xl font-semibold text-gray-900">{test.title}</h2>
                  {test._count.questions === 0 && (
                    <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                      Нет вопросов
                    </span>
                  )}
                </div>
                {test.description && (
                  <p className="text-gray-600 mb-3 text-sm">{test.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {test.section.station?.name} → {test.section.title}
                  </span>
                </div>
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
    </TestsListToggle>
  )
}
