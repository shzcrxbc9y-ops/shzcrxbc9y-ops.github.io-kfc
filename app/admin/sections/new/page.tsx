'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Station {
  id: string
  name: string
}

function NewSectionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultStationId = searchParams.get('stationId')

  const [loading, setLoading] = useState(false)
  const [stations, setStations] = useState<Station[]>([])
  const [formData, setFormData] = useState({
    stationId: defaultStationId || '',
    title: '',
    description: '',
    order: 0,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStations()
  }, [])

  const fetchStations = async () => {
    try {
      const res = await fetch('/api/stations')
      if (res.ok) {
        const data = await res.json()
        setStations(data.stations)
      }
    } catch (err) {
      console.error('Error fetching stations:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.stationId) {
      setError('Выберите станцию')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка при создании раздела')
      }

      router.push('/admin/sections')
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании раздела')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/admin/sections"
          className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад</span>
        </Link>
        <h1 className="text-3xl font-bold">Создать раздел</h1>
        <div></div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Станция *
          </label>
          <select
            value={formData.stationId}
            onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название раздела *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
            placeholder="Например: Чек-листы"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Описание
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Краткое описание раздела"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Порядок отображения
          </label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="0"
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Link
            href="/admin/sections"
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Отмена
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Создание...' : 'Создать раздел'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NewSectionPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Загрузка...</div>}>
      <NewSectionForm />
    </Suspense>
  )
}

