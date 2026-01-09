'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Station {
  id: string
  name: string
  sections: Section[]
}

interface Section {
  id: string
  title: string
  stationId: string
}

interface Test {
  id: string
  sectionId: string
  title: string
  description: string | null
  passingScore: number
  timeLimit: number | null
  isCertification: boolean
  section: {
    stationId: string
  }
}

export default function EditTestPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stations, setStations] = useState<Station[]>([])
  const [test, setTest] = useState<Test | null>(null)
  const [selectedStation, setSelectedStation] = useState<string>('')
  const [formData, setFormData] = useState({
    sectionId: '',
    title: '',
    description: '',
    passingScore: 70,
    timeLimit: '',
    isCertification: false,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    // Загружаем тест
    fetch(`/api/tests/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.test) {
          const testData = data.test
          setTest(testData)
          setFormData({
            sectionId: testData.sectionId,
            title: testData.title,
            description: testData.description || '',
            passingScore: testData.passingScore,
            timeLimit: testData.timeLimit ? testData.timeLimit.toString() : '',
            isCertification: testData.isCertification,
          })
          setSelectedStation(testData.section.stationId)
        }
      })
      .catch(err => {
        console.error('Error loading test:', err)
        setError('Ошибка загрузки теста')
      })

    // Загружаем станции
    fetch('/api/stations')
      .then(res => res.json())
      .then(data => {
        if (data.stations) {
          setStations(data.stations)
        }
      })
      .catch(err => {
        console.error('Error loading stations:', err)
      })
      .finally(() => setLoading(false))
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const payload = {
        ...formData,
        timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : undefined,
      }

      const res = await fetch(`/api/tests/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка при обновлении теста')
      }

      router.push('/admin/tests')
    } catch (err: any) {
      setError(err.message || 'Ошибка при обновлении теста')
    } finally {
      setSaving(false)
    }
  }

  const availableSections = selectedStation
    ? stations.find(s => s.id === selectedStation)?.sections || []
    : []

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/admin/tests"
                className="text-gray-600 hover:text-gray-900 text-sm mb-2 inline-block transition-colors font-medium"
              >
                ← Назад к тестам
              </Link>
              <h1 className="text-2xl font-semibold text-gray-900">Редактировать тест</h1>
              <p className="text-gray-600 mt-1 text-sm">Измените параметры теста</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

        <div>
          <label htmlFor="station" className="block text-sm font-medium text-gray-700 mb-2">
            Станция *
          </label>
          <select
            id="station"
            required
            value={selectedStation}
            onChange={(e) => {
              setSelectedStation(e.target.value)
              setFormData({ ...formData, sectionId: '' })
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Выберите станцию</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sectionId" className="block text-sm font-medium text-gray-700 mb-2">
            Раздел *
          </label>
          <select
            id="sectionId"
            required
            value={formData.sectionId}
            onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            disabled={!selectedStation}
          >
            <option value="">Выберите раздел</option>
            {availableSections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Название теста *
          </label>
          <input
            id="title"
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Описание
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="passingScore" className="block text-sm font-medium text-gray-700 mb-2">
              Проходной балл (%) *
            </label>
            <input
              id="passingScore"
              type="number"
              required
              min="0"
              max="100"
              value={formData.passingScore}
              onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || 70 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 mb-2">
              Лимит времени (минут)
            </label>
            <input
              id="timeLimit"
              type="number"
              min="1"
              value={formData.timeLimit}
              onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Не ограничено"
            />
          </div>
        </div>


          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <Link
              href="/admin/tests"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm hover:shadow-md font-medium"
            >
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>

        <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
          <p className="text-blue-800 text-sm mb-2">
            <strong>Управление вопросами:</strong> После сохранения теста вы сможете добавить вопросы.
          </p>
          <Link
            href={`/admin/tests/${params.id}/questions`}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm transition-colors shadow-sm"
          >
            Управление вопросами →
          </Link>
        </div>
      </div>
    </div>
  )
}
