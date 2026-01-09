'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, CheckCircle } from 'lucide-react'

interface Question {
  id: string
  text: string
  type: string
  options: Option[]
}

interface Option {
  id: string
  text: string
  isCorrect: boolean
}

interface Test {
  id: string
  title: string
  description?: string
  passingScore: number
  timeLimit?: number
  questions: Question[]
}

export default function TestPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [test, setTest] = useState<Test | null>(null)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTest()
  }, [params.id])

  useEffect(() => {
    if (test?.timeLimit && timeLeft !== null) {
      if (timeLeft <= 0) {
        handleSubmit()
        return
      }
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timeLeft, test])

  const fetchTest = async () => {
    try {
      const res = await fetch(`/api/tests/${params.id}`)
      if (!res.ok) throw new Error('Ошибка загрузки теста')
      const data = await res.json()
      setTest(data.test)
      if (data.test.timeLimit) {
        setTimeLeft(data.test.timeLimit * 60)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, optionId: string, isMultiple: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] || []
      if (isMultiple) {
        return {
          ...prev,
          [questionId]: current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        }
      } else {
        return {
          ...prev,
          [questionId]: [optionId],
        }
      }
    })
  }

  const handleSubmit = async () => {
    if (!test) return

    const allAnswered = test.questions.every((q) => answers[q.id]?.length > 0)
    if (!allAnswered) {
      if (!confirm('Не все вопросы отвечены. Отправить тест?')) {
        return
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/tests/${params.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })

      if (!res.ok) throw new Error('Ошибка отправки теста')

      const data = await res.json()
      router.push(`/tests/${params.id}/result`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка теста...</p>
        </div>
      </div>
    )
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded">
            {error || 'Тест не найден'}
          </div>
          <Link
            href="/tests"
            className="inline-block mt-4 text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            ← Назад к тестам
          </Link>
        </div>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">{test.title}</h1>
              {test.description && (
                <p className="text-gray-600 text-sm">{test.description}</p>
              )}
            </div>
            {timeLeft !== null && (
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-md font-semibold ${
                timeLeft < 60 
                  ? 'bg-red-100 text-red-700' 
                  : timeLeft < 300 
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                <Clock className="w-5 h-5" />
                <span className="text-lg">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">

          <div className="space-y-8 mb-8">
            {test.questions.map((question, index) => {
              const isAnswered = answers[question.id]?.length > 0
              return (
                <div 
                  key={question.id} 
                  className={`p-5 rounded-lg border-2 ${
                    isAnswered 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start space-x-3 mb-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      {question.text}
                    </h3>
                  </div>
                  {question.type === 'multiple' && (
                    <div className="mb-3 text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded inline-block">
                      Можно выбрать несколько ответов
                    </div>
                  )}
                  <div className="space-y-2">
                    {question.options.map((option) => {
                      const isSelected = answers[question.id]?.includes(option.id)
                      return (
                        <label
                          key={option.id}
                          className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-purple-50 border-purple-500 shadow-sm'
                              : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                            name={question.id}
                            checked={isSelected}
                            onChange={() =>
                              handleAnswerChange(question.id, option.id, question.type === 'multiple')
                            }
                            className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="flex-1 text-gray-900">{option.text}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{Object.keys(answers).length}</span> из{' '}
              <span className="font-semibold text-gray-900">{test.questions.length}</span> вопросов отвечено
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-purple-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2 shadow-sm hover:shadow-md"
            >
              {submitting ? (
                <>
                  <span>Отправка...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Завершить тест</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

