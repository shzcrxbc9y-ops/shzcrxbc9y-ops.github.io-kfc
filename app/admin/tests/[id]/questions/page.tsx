'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit2, Trash2, CheckCircle, Circle } from 'lucide-react'

interface Option {
  id: string
  text: string
  isCorrect: boolean
  order: number
}

interface Question {
  id: string
  text: string
  type: 'single' | 'multiple'
  order: number
  options: Option[]
}

interface Test {
  id: string
  title: string
}

export default function TestQuestionsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [test, setTest] = useState<Test | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      // Загружаем тест
      const testRes = await fetch(`/api/tests/${params.id}`)
      const testData = await testRes.json()
      if (testData.test) {
        setTest({
          id: testData.test.id,
          title: testData.test.title,
        })
      }

      // Загружаем вопросы
      const questionsRes = await fetch(`/api/tests/${params.id}/questions`)
      const questionsData = await questionsRes.json()
      if (questionsData.questions) {
        setQuestions(questionsData.questions)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот вопрос?')) {
      return
    }

    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Ошибка при удалении вопроса')
      }

      loadData()
    } catch (err: any) {
      alert(err.message || 'Ошибка при удалении вопроса')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">Загрузка...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <Link
                href="/admin/tests"
                className="text-gray-600 hover:text-gray-900 text-sm mb-2 inline-block transition-colors font-medium"
              >
                ← Назад к тестам
              </Link>
              <h1 className="text-2xl font-semibold text-gray-900">Вопросы теста</h1>
              {test && (
                <p className="text-gray-600 mt-1 text-sm">
                  {test.title} • Всего вопросов: <strong>{questions.length}</strong>
                </p>
              )}
            </div>
            <button
              onClick={() => setShowAddQuestion(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить вопрос</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {showAddQuestion && (
          <QuestionForm
            testId={params.id}
            onClose={() => setShowAddQuestion(false)}
            onSuccess={() => {
              setShowAddQuestion(false)
              loadData()
            }}
          />
        )}

        {editingQuestion && (
          <QuestionEditForm
            questionId={editingQuestion}
            onClose={() => setEditingQuestion(null)}
            onSuccess={() => {
              setEditingQuestion(null)
              loadData()
            }}
          />
        )}

        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет вопросов</h3>
              <p className="text-gray-600 mb-4">Добавьте первый вопрос для этого теста</p>
              <button
                onClick={() => setShowAddQuestion(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить вопрос
              </button>
            </div>
          ) : (
            questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index + 1}
                onEdit={() => setEditingQuestion(question.id)}
                onDelete={() => handleDeleteQuestion(question.id)}
                onUpdate={loadData}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Компонент карточки вопроса
function QuestionCard({
  question,
  index,
  onEdit,
  onDelete,
  onUpdate,
}: {
  question: Question
  index: number
  onEdit: () => void
  onDelete: () => void
  onUpdate: () => void
}) {
  const [showAddOption, setShowAddOption] = useState(false)
  const [editingOption, setEditingOption] = useState<string | null>(null)

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm('Удалить этот вариант ответа?')) {
      return
    }

    try {
      const res = await fetch(`/api/options/${optionId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Ошибка при удалении варианта ответа')
      }

      onUpdate()
    } catch (err: any) {
      alert(err.message || 'Ошибка при удалении варианта ответа')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">#{index}</span>
            <h3 className="text-lg font-semibold text-gray-900">{question.text}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              question.type === 'single' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              {question.type === 'single' ? 'Один ответ' : 'Несколько ответов'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Редактировать вопрос"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Удалить вопрос"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Варианты ответов ({question.options.length}):
        </div>
        {question.options.map((option) => (
          <div
            key={option.id}
            className={`flex items-center justify-between p-3 rounded border transition-colors ${
              option.isCorrect 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-3 flex-1">
              {option.isCorrect ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
              <span className={option.isCorrect ? 'font-semibold text-green-700' : 'text-gray-700'}>
                {option.text}
              </span>
              {option.isCorrect && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Правильный
                </span>
              )}
            </div>
            {editingOption === option.id ? (
              <OptionEditForm
                option={option}
                questionType={question.type}
                onClose={() => setEditingOption(null)}
                onSuccess={() => {
                  setEditingOption(null)
                  onUpdate()
                }}
              />
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingOption(option.id)}
                  className="p-1 text-gray-600 hover:text-primary-600"
                  title="Редактировать"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteOption(option.id)}
                  className="p-1 text-red-600 hover:text-red-700"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAddOption ? (
        <OptionForm
          questionId={question.id}
          questionType={question.type}
          onClose={() => setShowAddOption(false)}
          onSuccess={() => {
            setShowAddOption(false)
            onUpdate()
          }}
        />
      ) : (
        <button
          onClick={() => setShowAddOption(true)}
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить вариант ответа</span>
        </button>
      )}
    </div>
  )
}

// Форма добавления вопроса
function QuestionForm({
  testId,
  onClose,
  onSuccess,
}: {
  testId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    text: '',
    type: 'single' as 'single' | 'multiple',
    order: 0,
    options: [
      { text: '', isCorrect: false, order: 0 },
      { text: '', isCorrect: false, order: 1 },
    ] as Array<{ text: string; isCorrect: boolean; order: number }>,
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.text.trim()) {
      setError('Введите текст вопроса')
      return
    }

    const validOptions = formData.options.filter(opt => opt.text.trim())
    if (validOptions.length < 2) {
      setError('Должно быть минимум 2 варианта ответа')
      return
    }

    const hasCorrect = validOptions.some(opt => opt.isCorrect)
    if (!hasCorrect) {
      setError('Должен быть хотя бы один правильный ответ')
      return
    }

    if (formData.type === 'single' && validOptions.filter(opt => opt.isCorrect).length > 1) {
      setError('Для вопроса с одним ответом может быть только один правильный вариант')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/tests/${testId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: formData.text,
          type: formData.type,
          order: formData.order,
          options: validOptions.map((opt, index) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: index,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка при создании вопроса')
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании вопроса')
    } finally {
      setLoading(false)
    }
  }

  const addOption = () => {
    setFormData({
      ...formData,
      options: [
        ...formData.options,
        { text: '', isCorrect: false, order: formData.options.length },
      ],
    })
  }

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) {
      alert('Должно быть минимум 2 варианта ответа')
      return
    }
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    })
  }

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...formData.options]
    if (field === 'isCorrect' && formData.type === 'single' && value) {
      // Для single вопроса снимаем другие правильные ответы
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === index
      })
    } else {
      newOptions[index] = { ...newOptions[index], [field]: value }
    }
    setFormData({ ...formData, options: newOptions })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Добавить вопрос</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Текст вопроса *
          </label>
          <textarea
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип вопроса *
          </label>
          <select
            value={formData.type}
            onChange={(e) => {
              const newType = e.target.value as 'single' | 'multiple'
              // При смене типа на single оставляем только первый правильный ответ
              if (newType === 'single') {
                const firstCorrect = formData.options.findIndex(opt => opt.isCorrect)
                const newOptions = formData.options.map((opt, i) => ({
                  ...opt,
                  isCorrect: i === firstCorrect && firstCorrect !== -1,
                }))
                setFormData({ ...formData, type: newType, options: newOptions })
              } else {
                setFormData({ ...formData, type: newType })
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="single">Один правильный ответ</option>
            <option value="multiple">Несколько правильных ответов</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Варианты ответов *
          </label>
          <div className="space-y-2">
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type={formData.type === 'single' ? 'radio' : 'checkbox'}
                  checked={option.isCorrect}
                  onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
                  className="w-4 h-4 text-primary-600"
                />
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => updateOption(index, 'text', e.target.value)}
                  placeholder={`Вариант ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                {formData.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить вариант</span>
          </button>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Создание...' : 'Создать вопрос'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Форма редактирования вопроса
function QuestionEditForm({
  questionId,
  onClose,
  onSuccess,
}: {
  questionId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    text: '',
    type: 'single' as 'single' | 'multiple',
    order: 0,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/questions/${questionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.question) {
          setFormData({
            text: data.question.text,
            type: data.question.type,
            order: data.question.order,
          })
        }
      })
      .catch(err => {
        setError('Ошибка загрузки вопроса')
      })
      .finally(() => setLoading(false))
  }, [questionId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка при обновлении вопроса')
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Ошибка при обновлении вопроса')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="text-center">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Редактировать вопрос</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Текст вопроса *
          </label>
          <textarea
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип вопроса *
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'single' | 'multiple' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="single">Один правильный ответ</option>
            <option value="multiple">Несколько правильных ответов</option>
          </select>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Форма добавления варианта ответа
function OptionForm({
  questionId,
  questionType,
  onClose,
  onSuccess,
}: {
  questionId: string
  questionType: 'single' | 'multiple'
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    text: '',
    isCorrect: false,
    order: 0,
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.text.trim()) {
      setError('Введите текст варианта ответа')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/questions/${questionId}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка при создании варианта ответа')
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании варианта ответа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 rounded p-3 mb-2">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          type={questionType === 'single' ? 'radio' : 'checkbox'}
          checked={formData.isCorrect}
          onChange={(e) => setFormData({ ...formData, isCorrect: e.target.checked })}
          className="w-4 h-4 text-primary-600"
        />
        <input
          type="text"
          value={formData.text}
          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
          placeholder="Текст варианта ответа"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 text-sm"
        >
          {loading ? '...' : 'Добавить'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
        >
          Отмена
        </button>
      </form>
      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}
    </div>
  )
}

// Форма редактирования варианта ответа
function OptionEditForm({
  option,
  questionType,
  onClose,
  onSuccess,
}: {
  option: Option
  questionType: 'single' | 'multiple'
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    text: option.text,
    isCorrect: option.isCorrect,
    order: option.order,
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.text.trim()) {
      setError('Введите текст варианта ответа')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/options/${option.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка при обновлении варианта ответа')
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Ошибка при обновлении варианта ответа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          type={questionType === 'single' ? 'radio' : 'checkbox'}
          checked={formData.isCorrect}
          onChange={(e) => setFormData({ ...formData, isCorrect: e.target.checked })}
          className="w-4 h-4 text-primary-600"
        />
        <input
          type="text"
          value={formData.text}
          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 text-sm"
        >
          {loading ? '...' : 'Сохранить'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
        >
          Отмена
        </button>
      </form>
      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}
    </div>
  )
}
