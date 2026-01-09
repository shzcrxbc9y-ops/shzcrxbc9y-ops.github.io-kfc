'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Station {
  id: string
  name: string
}

interface Section {
  id: string
  stationId: string | null
  title: string
  description: string | null
  order: number
}

export default function EditSectionPage() {
  const router = useRouter()
  const params = useParams()
  const sectionId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stations, setStations] = useState<Station[]>([])
  const [section, setSection] = useState<Section | null>(null)
  const [formData, setFormData] = useState({
    stationId: '',
    title: '',
    description: '',
    order: 0,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStations()
    fetchSection()
  }, [sectionId])

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

  const fetchSection = async () => {
    try {
      const res = await fetch(`/api/sections/${sectionId}`)
      if (res.ok) {
        const data = await res.json()
        const sec = data.section
        setSection(sec)
        setFormData({
          stationId: sec.stationId || '',
          title: sec.title,
          description: sec.description || '',
          order: sec.order,
        })
      }
    } catch (err) {
      setError('Ошибка при загрузке раздела')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    if (!formData.stationId) {
      setError('Выберите станцию')
      setSaving(false)
      return
    }

    try {
      const res = await fetch(`/api/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка при обновлении раздела')
      }

      router.push('/admin/sections')
    } catch (err: any) {
      setError(err.message || 'Ошибка при обновлении раздела')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Загрузка...</div>
      </div>
    )
  }

  if (!section) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">Раздел не найден</div>
      </div>
    )
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
        <h1 className="text-3xl font-bold">Редактировать раздел</h1>
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
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </form>
    </div>
  )
}

