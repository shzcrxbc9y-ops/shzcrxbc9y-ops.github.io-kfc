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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Загрузка теста...</div>
      </div>
    )
  }

  if (error || !test) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Тест не найден'}
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/tests"
        className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Назад к тестам</span>
      </Link>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{test.title}</h1>
            {test.description && (
              <p className="text-gray-600">{test.description}</p>
            )}
          </div>
          {timeLeft !== null && (
            <div className="flex items-center space-x-2 text-lg font-semibold text-primary-600">
              <Clock className="w-5 h-5" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        <div className="space-y-8 mb-8">
          {test.questions.map((question, index) => (
            <div key={question.id} className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4">
                {index + 1}. {question.text}
              </h3>
              <div className="space-y-2">
                {question.options.map((option) => {
                  const isSelected = answers[question.id]?.includes(option.id)
                  return (
                    <label
                      key={option.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary-50 border-primary-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                        name={question.id}
                        checked={isSelected}
                        onChange={() =>
                          handleAnswerChange(question.id, option.id, question.type === 'multiple')
                        }
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="flex-1">{option.text}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Отвечено: {Object.keys(answers).length} / {test.questions.length}
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
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
  )
}

