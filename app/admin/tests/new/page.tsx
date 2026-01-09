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

export default function NewTestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingStations, setLoadingStations] = useState(true)
  const [stations, setStations] = useState<Station[]>([])
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
    // Загружаем станции и разделы
    fetch('/api/stations')
      .then(res => res.json())
      .then(data => {
        if (data.stations) {
          setStations(data.stations)
        }
      })
      .catch(err => {
        console.error('Error loading stations:', err)
        setError('Ошибка загрузки станций')
      })
      .finally(() => setLoadingStations(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.sectionId) {
      setError('Выберите раздел')
      setLoading(false)
      return
    }

    try {
      const payload = {
        ...formData,
        timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : undefined,
      }

      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка при создании теста')
      }

      router.push('/admin/tests')
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании теста')
    } finally {
      setLoading(false)
    }
  }

  const availableSections = selectedStation
    ? stations.find(s => s.id === selectedStation)?.sections || []
    : []

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
              <h1 className="text-2xl font-semibold text-gray-900">Создать новый тест</h1>
              <p className="text-gray-600 mt-1 text-sm">Заполните форму для создания нового теста</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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
            disabled={loadingStations}
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
            placeholder="Например: Тест по основам работы на кухне"
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
            placeholder="Описание теста..."
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
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm hover:shadow-md font-medium"
          >
            {loading ? 'Создание...' : 'Создать тест'}
          </button>
        </div>
      </form>

      <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <strong>Следующий шаг:</strong> После создания теста вы сможете добавить вопросы и варианты ответов на странице редактирования теста.
        </p>
      </div>
      </div>
    </div>
  )
}
